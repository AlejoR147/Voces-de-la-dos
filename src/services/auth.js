import { ROLES, SECURITY, STORAGE_KEYS } from '../config/constants.js';
import { ADMIN_CONFIG, ADMIN_ENABLED } from '../config/admin.js';
import { hashPassword, randomSalt, safeEqual } from '../core/crypto.js';
import { readJSON } from '../core/storage.js';
import {
  accountsStore, clearLockout, findAccountByEmail, findAccountById, normalizeEmail,
  patchAccount, removeAccount, saveAccount, setLockout,
} from '../state/accountsStore.js';
import { appStore, endSession, getUser, startSession } from '../state/appStore.js';
import { purgeUserContent } from '../state/contentStore.js';
import { calculateAffinities } from './affinity.js';
import { logEvent } from './audit.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGISTRABLE_ROLES = [ROLES.CONSUMER, ROLES.MANAGER];
const GENERIC_LOGIN_ERROR = 'Correo o contraseña incorrectos.';

let lastActivity = Date.now();
let idleTimer = null;
let onExpire = () => {};

export function validateEmail(email) {
  return EMAIL_PATTERN.test(email.trim()) ? '' : 'Escribe un correo válido.';
}

export function validatePassword(password) {
  if (password.length < SECURITY.passwordMinLength) return `La contraseña debe tener al menos ${SECURITY.passwordMinLength} caracteres.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'La contraseña debe combinar letras y números.';
  return '';
}

const newId = () => `user-${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;

function publicUser(account) {
  return { id: account.id, email: account.email, role: account.role, ...account.profile };
}

const adminUser = () => ({
  id: 'admin', email: ADMIN_CONFIG.email, role: ROLES.ADMIN, name: ADMIN_CONFIG.name,
});

function passwordMatches(candidate, record) {
  return hashPassword(candidate, record.salt, record.iterations)
    .then((hash) => safeEqual(hash, record.passwordHash ?? record.hash));
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
    logEvent('locked', { email: key, detail: `${SECURITY.maxFailedAttempts} intentos fallidos` });
  } else {
    setLockout(email, { count, until: 0 });
    logEvent('login_fail', { email: key });
  }
}

export async function registerAccount({ email, password, role, profile }) {
  if (!REGISTRABLE_ROLES.includes(role)) return { ok: false, error: 'Tipo de cuenta no permitido.' };
  const emailError = validateEmail(email);
  if (emailError) return { ok: false, error: emailError, field: 'email' };
  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false, error: passwordError, field: 'password' };

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
    profile,
    affinities: role === ROLES.CONSUMER ? calculateAffinities(profile.interests) : [],
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
  const normalized = normalizeEmail(email);
  const locked = remainingLockout(normalized);
  if (locked) return { ok: false, error: `Demasiados intentos. Intenta de nuevo en ${locked} s.`, locked };

  const isAdminAttempt = ADMIN_ENABLED && normalized === ADMIN_CONFIG.email;
  const account = isAdminAttempt ? null : findAccountByEmail(normalized);
  const record = isAdminAttempt
    ? { salt: ADMIN_CONFIG.salt, iterations: ADMIN_CONFIG.iterations, hash: ADMIN_CONFIG.hash }
    : account ?? { salt: 'no-account', iterations: SECURITY.pbkdf2Iterations, passwordHash: '' };

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

export function restoreSession() {
  const pointer = readJSON(STORAGE_KEYS.session);
  if (!pointer?.userId) return;
  const account = findAccountById(pointer.userId);
  const valid = account && REGISTRABLE_ROLES.includes(account.role) && pointer.expiresAt > Date.now();
  if (!valid) {
    endSession();
    if (account && pointer.expiresAt <= Date.now()) logEvent('session_expired', { email: account.email, role: account.role });
    return;
  }
  startSession(publicUser(account), { affinities: account.affinities, expiresAt: pointer.expiresAt });
}

export function initAuth({ onSessionExpired = () => {} } = {}) {
  onExpire = onSessionExpired;
  restoreSession();

  const touch = () => { lastActivity = Date.now(); };
  ['pointerdown', 'keydown', 'scroll'].forEach((name) => window.addEventListener(name, touch, { passive: true }));

  idleTimer = setInterval(() => {
    const user = getUser();
    if (user?.role === ROLES.ADMIN && Date.now() - lastActivity > SECURITY.adminIdleMs) logout('session_expired');
  }, 15000);
  return () => clearInterval(idleTimer);
}

export function updateProfile(patch) {
  const user = getUser();
  if (!user || user.role === ROLES.ADMIN) return;
  const account = findAccountById(user.id);
  if (!account) return;

  const profile = { ...account.profile, ...patch };
  const interestsChanged = patch.interests
    && [...patch.interests].sort().join() !== [...account.profile.interests].sort().join();
  const affinities = account.role === ROLES.CONSUMER && interestsChanged
    ? calculateAffinities(patch.interests)
    : account.affinities;

  patchAccount(user.id, { profile, affinities });
  appStore.setState({ user: { ...user, ...profile }, affinities });
}

async function verifyCurrentPassword(password) {
  const user = getUser();
  const account = user && findAccountById(user.id);
  return Boolean(account) && passwordMatches(password, account);
}

export async function changePassword(current, next) {
  const user = getUser();
  if (!user || user.role === ROLES.ADMIN) return { ok: false, error: 'No disponible para esta cuenta.' };
  if (!await verifyCurrentPassword(current)) return { ok: false, error: 'La contraseña actual no es correcta.' };
  const error = validatePassword(next);
  if (error) return { ok: false, error };

  const salt = randomSalt();
  patchAccount(user.id, {
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
  if (!await verifyCurrentPassword(password)) return { ok: false, error: 'La contraseña no es correcta.' };

  purgeUserContent(user.id);
  removeAccount(user.id);
  logEvent('account_deleted', { email: user.email, role: user.role });
  endSession();
  return { ok: true };
}
