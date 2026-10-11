import { ROLES, SECURITY, STORAGE_KEYS } from '../config/constants.js';
import { ADMIN_CONFIG, ADMIN_ENABLED } from '../config/admin.js';
import { hashPassword, randomSalt, safeEqual } from '../core/crypto.js';
import { readJSON } from '../core/storage.js';
import {
  accountsStore, clearLockout, findAccountByEmail, findAccountById, normalizeEmail,
  patchAccount, removeAccount, saveAccount, setLockout, updateAccountCredentials,
} from '../state/accountsStore.js';
import { appStore, endSession, getUser, startSession } from '../state/appStore.js';
import { purgeUserContent } from '../state/contentStore.js';
import { calculateAffinities } from './affinity.js';
import { logEvent, purgeUserEntries } from './audit.js';
import { sanitizeProfile } from './validation.js';

const EMAIL_MAX = 254;
const PASSWORD_MAX = 256;
const ITERATIONS_MAX = 1000000;
const HASH_HEX64 = /^[0-9a-f]{64}$/;
const REGISTRABLE_ROLES = [ROLES.CONSUMER, ROLES.MANAGER];
const CRYPTO_ERROR = 'Tu navegador necesita una conexión segura (HTTPS) para proteger las contraseñas.';
const cryptoAvailable = () => Boolean(globalThis.crypto?.subtle);
const GENERIC_LOGIN_ERROR = 'Correo o contraseña incorrectos.';

let lastActivity = Date.now();
let idleTimer = null;
let onExpire = () => {};

/**
 * Validador de email lineal de una pasada (sin regex con backtracking): sustituye a
 * `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`. La entrada se acota a 254 caracteres ANTES de
 * validar, para que un string gigante por consola/devtools no llegue al chequeo.
 */
function isEmailShape(email) {
  if (typeof email !== 'string' || email.length === 0 || email.length > EMAIL_MAX) return false;
  const at = email.indexOf('@');
  if (at <= 0 || at > 64 || at !== email.lastIndexOf('@')) return false;
  if (email.includes('..')) return false;
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  if (dot <= 0 || dot === domain.length - 1 || domain.length - dot - 1 < 2) return false;
  for (const char of email) {
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') return false;
  }
  return true;
}

export function validateEmail(email) {
  const value = String(email ?? '').trim().slice(0, EMAIL_MAX + 1);
  return isEmailShape(value) ? '' : 'Escribe un correo válido.';
}

export function validatePassword(password) {
  const value = String(password ?? '');
  // Acota antes de testear (los formularios ya usan maxlength=128; esto cubre devtools).
  if (value.length > PASSWORD_MAX) return 'La contraseña es demasiado larga.';
  if (value.length < SECURITY.passwordMinLength) return `La contraseña debe tener al menos ${SECURITY.passwordMinLength} caracteres.`;
  // Clases de un solo carácter: chequeo lineal, sin riesgo ReDoS.
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'La contraseña debe combinar letras y números.';
  return '';
}

const newId = () => `user-${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;

function publicUser(account) {
  return { id: account.id, email: account.email, role: account.role, ...account.profile };
}

const adminUser = () => ({
  id: 'admin', email: ADMIN_CONFIG.email, role: ROLES.ADMIN, name: ADMIN_CONFIG.name,
});

/** Forma válida de un registro de credenciales (hash PBKDF2 de 256 bits en hex). */
function isCredentialRecord(record) {
  if (!record || typeof record !== 'object') return false;
  const hash = record.passwordHash ?? record.hash;
  return typeof record.salt === 'string' && record.salt.length > 0 && record.salt.length <= 128
    && Number.isFinite(record.iterations) && record.iterations > 0 && record.iterations <= ITERATIONS_MAX
    && typeof hash === 'string' && HASH_HEX64.test(hash);
}

async function passwordMatches(candidate, record) {
  // Registro corrupto (storage manipulado): falso + auditoría, nunca lanzar (evita DoS y botón colgado).
  if (!isCredentialRecord(record)) {
    logEvent('denied', { detail: 'Registro de credenciales corrupto' });
    return false;
  }
  try {
    const hash = await hashPassword(String(candidate ?? ''), record.salt, Math.floor(record.iterations));
    return safeEqual(hash, record.passwordHash ?? record.hash);
  } catch {
    logEvent('denied', { detail: 'Fallo al derivar credenciales' });
    return false;
  }
}

function remainingLockout(email) {
  const lockout = accountsStore.getState().lockouts[normalizeEmail(email)];
  return lockout?.until && lockout.until > Date.now() ? Math.ceil((lockout.until - Date.now()) / 1000) : 0;
}

function registerFailure(email) {
  const key = normalizeEmail(email);
  const current = accountsStore.getState().lockouts[key] ?? { count: 0, until: 0 };
  const count = (current.until > Date.now() ? 0 : current.count) + 1;
  if (count >= SECURITY.maxFailedAttempts) {
    setLockout(email, { count: 0, until: Date.now() + SECURITY.lockoutMs });
    // El 5.º fallo también cuenta como intento fallido, además del bloqueo.
    logEvent('login_fail', { email: key });
    logEvent('locked', { email: key, detail: `${SECURITY.maxFailedAttempts} intentos fallidos` });
  } else {
    setLockout(email, { count, until: 0 });
    logEvent('login_fail', { email: key });
  }
}

export async function registerAccount({ email, password, role, profile }) {
  if (!REGISTRABLE_ROLES.includes(role)) return { ok: false, error: 'Tipo de cuenta no permitido.' };
  if (!cryptoAvailable()) return { ok: false, error: CRYPTO_ERROR };
  const emailError = validateEmail(email);
  if (emailError) return { ok: false, error: emailError, field: 'email' };
  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false, error: passwordError, field: 'password' };

  const checked = sanitizeProfile(role, profile);
  if (!checked.ok) return { ok: false, error: checked.error };

  const normalized = normalizeEmail(email);
  if (findAccountByEmail(normalized) || normalized === ADMIN_CONFIG.email) {
    return { ok: false, error: 'Ya existe una cuenta con ese correo.', field: 'email' };
  }

  const salt = randomSalt();
  const account = {
    id: newId(),
    email: normalized,
    role,
    salt,
    iterations: SECURITY.pbkdf2Iterations,
    passwordHash: await hashPassword(password, salt, SECURITY.pbkdf2Iterations),
    profile: checked.profile,
    affinities: role === ROLES.CONSUMER ? calculateAffinities(checked.profile.interests) : [],
    createdAt: new Date().toISOString(),
  };
  saveAccount(account);
  logEvent('register', { email: normalized, role });
  beginUserSession(account);
  return { ok: true };
}

function beginUserSession(account) {
  startSession(publicUser(account), {
    affinities: account.affinities,
    expiresAt: Date.now() + SECURITY.userSessionTtlMs,
  });
}

export async function login(email, password) {
  if (!cryptoAvailable()) return { ok: false, error: CRYPTO_ERROR };
  const normalized = normalizeEmail(email);
  const locked = remainingLockout(normalized);
  if (locked) return { ok: false, error: `Demasiados intentos. Intenta de nuevo en ${locked} s.`, locked };

  const isAdminAttempt = ADMIN_ENABLED && normalized === ADMIN_CONFIG.email;
  const account = isAdminAttempt ? null : findAccountByEmail(normalized);
  // Señuelo con forma válida para no filtrar por tiempo si la cuenta existe o no.
  const record = isAdminAttempt
    ? { salt: ADMIN_CONFIG.salt, iterations: ADMIN_CONFIG.iterations, hash: ADMIN_CONFIG.hash }
    : account ?? { salt: 'no-account-salt', iterations: SECURITY.pbkdf2Iterations, passwordHash: '0'.repeat(64) };

  const valid = await passwordMatches(password, record) && (isAdminAttempt || Boolean(account));
  if (!valid) {
    registerFailure(normalized);
    const nowLocked = remainingLockout(normalized);
    return nowLocked
      ? { ok: false, error: `Demasiados intentos. Intenta de nuevo en ${nowLocked} s.`, locked: nowLocked }
      : { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  clearLockout(normalized);
  if (isAdminAttempt) {
    startSession(adminUser());
    lastActivity = Date.now();
    logEvent('login_ok', { email: normalized, role: ROLES.ADMIN });
  } else {
    beginUserSession(account);
    logEvent('login_ok', { email: normalized, role: account.role });
  }
  return { ok: true };
}

export function logout(reason = 'logout') {
  const user = getUser();
  if (user) logEvent(reason, { email: user.email, role: user.role });
  endSession();
  if (reason === 'session_expired') onExpire();
}

/** Forma válida del puntero persistido `{ userId, expiresAt }`. */
function isSessionPointer(value) {
  return Boolean(value) && typeof value === 'object'
    && typeof value.userId === 'string' && value.userId.length > 0 && value.userId.length <= 128
    && Number.isFinite(value.expiresAt);
}

export function restoreSession() {
  const pointer = readJSON(STORAGE_KEYS.session);
  if (!pointer) return;
  // Sin backend la integridad total es imposible: ante un puntero inválido/manipulado
  // se cierra la sesión y se audita, en lugar de confiar en el storage local.
  if (!isSessionPointer(pointer)) {
    endSession();
    logEvent('denied', { detail: 'Puntero de sesión inválido' });
    return;
  }
  const account = findAccountById(pointer.userId);
  const valid = account && REGISTRABLE_ROLES.includes(account.role) && pointer.expiresAt > Date.now();
  if (!valid) {
    endSession();
    if (account && pointer.expiresAt <= Date.now()) {
      logEvent('session_expired', { email: account.email, role: account.role });
    } else {
      logEvent('denied', { detail: 'Sesión sin cuenta asociada' });
    }
    return;
  }
  startSession(publicUser(account), { affinities: account.affinities, expiresAt: pointer.expiresAt });
  logEvent('login_ok', { email: account.email, role: account.role, detail: 'Sesión restaurada' });
}

export function initAuth({ onSessionExpired = () => {} } = {}) {
  onExpire = onSessionExpired;
  restoreSession();

  const touch = () => { lastActivity = Date.now(); };
  ['pointerdown', 'keydown', 'scroll'].forEach((name) => window.addEventListener(name, touch, { passive: true }));

  idleTimer = setInterval(() => {
    const user = getUser();
    if (!user) return;
    if (user.role === ROLES.ADMIN) {
      if (Date.now() - lastActivity > SECURITY.adminIdleMs) logout('session_expired');
      return;
    }
    // Recalcula la expiración en caliente también para usuarias/os (no solo idle de admin):
    // si el puntero desapareció, se corrompió o caducó, la sesión termina aquí mismo.
    const pointer = readJSON(STORAGE_KEYS.session);
    if (!isSessionPointer(pointer) || pointer.userId !== user.id || pointer.expiresAt <= Date.now()) {
      logout('session_expired');
    }
  }, 15000);
  return () => clearInterval(idleTimer);
}

export function updateProfile(patch) {
  const user = getUser();
  if (!user || user.role === ROLES.ADMIN) return { ok: false, error: 'No disponible para esta cuenta.' };
  const account = findAccountById(user.id);
  if (!account) return { ok: false, error: 'Cuenta no encontrada.' };

  const checked = sanitizeProfile(account.role, { ...account.profile, ...patch });
  if (!checked.ok) return checked;

  const interestsChanged = [...checked.profile.interests].sort().join() !== [...account.profile.interests].sort().join();
  const affinities = account.role === ROLES.CONSUMER && interestsChanged
    ? calculateAffinities(checked.profile.interests)
    : account.affinities;

  patchAccount(user.id, { profile: checked.profile, affinities });
  appStore.setState({ user: { ...user, ...checked.profile }, affinities });
  logEvent('profile_updated', { email: user.email, role: account.role });
  return { ok: true };
}

async function verifyCurrentPassword(password) {
  const user = getUser();
  const account = user && findAccountById(user.id);
  return Boolean(account) && passwordMatches(password, account);
}

export async function changePassword(current, next) {
  const user = getUser();
  if (!user || user.role === ROLES.ADMIN) return { ok: false, error: 'No disponible para esta cuenta.' };
  if (!await verifyCurrentPassword(current)) {
    logEvent('denied', { email: user.email, role: user.role, detail: 'Cambio de contraseña rechazado' });
    return { ok: false, error: 'La contraseña actual no es correcta.' };
  }
  const error = validatePassword(next);
  if (error) return { ok: false, error };

  const salt = randomSalt();
  updateAccountCredentials(user.id, {
    salt,
    iterations: SECURITY.pbkdf2Iterations,
    passwordHash: await hashPassword(next, salt, SECURITY.pbkdf2Iterations),
  });
  logEvent('password_changed', { email: user.email, role: user.role });
  return { ok: true };
}

export async function deleteAccount(password) {
  const user = getUser();
  if (!user || user.role === ROLES.ADMIN) return { ok: false, error: 'No disponible para esta cuenta.' };
  if (!await verifyCurrentPassword(password)) {
    logEvent('denied', { email: user.email, role: user.role, detail: 'Eliminación de cuenta rechazada' });
    return { ok: false, error: 'La contraseña no es correcta.' };
  }

  purgeUserContent(user.id);
  removeAccount(user.id);
  // Derecho al olvido local: purga las entradas de auditoría del usuario y deja
  // una lápida sin PII (sin `email`) en lugar de reintroducir su correo.
  purgeUserEntries(user.email);
  logEvent('account_deleted', { role: user.role, detail: 'Cuenta eliminada' });
  endSession();
  return { ok: true };
}
