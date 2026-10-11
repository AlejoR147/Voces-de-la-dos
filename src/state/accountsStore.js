import { createStore } from '../core/store.js';
import { ROLES, STORAGE_KEYS } from '../config/constants.js';

/**
 * Local account registry (demo persistence, no server). Stored accounts are never allowed to hold the
 * admin role: administrators only exist through the build-time credentials in `config/admin.js`.
 * Defensa en profundidad: `patchAccount` solo acepta perfil/afinidad (whitelist) y la rotación de
 * credenciales pasa por `updateAccountCredentials`, que valida forma. Sin backend, un atacante con
 * acceso a devtools puede saltarse estos controles: son última línea, no garantía.
 */
export const accountsStore = createStore(
  { accounts: [], lockouts: {} },
  { persistKey: STORAGE_KEYS.accounts },
);

const EMAIL_MAX = 254;
const HASH_HEX64 = /^[0-9a-f]{64}$/;
const ITERATIONS_MAX = 1000000;

// Coacciona a string y acota: `normalizeEmail` se llama con input de formularios y de devtools.
export const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase().slice(0, EMAIL_MAX);

export const findAccountByEmail = (email) => accountsStore.getState().accounts
  .find((account) => account.email === normalizeEmail(email));

export const findAccountById = (id) => accountsStore.getState().accounts.find((account) => account.id === id);

export function saveAccount(account) {
  if (!account || typeof account !== 'object') throw new Error('Cuenta no válida.');
  // Rechazo explícito: ninguna cuenta persistida puede nacer (ni mutar a) `admin`.
  if (account.role === ROLES.ADMIN) throw new Error('Tipo de cuenta no permitido.');
  accountsStore.setState(({ accounts }) => ({ accounts: [...accounts, account] }));
}

// Campos mutables por esta vía: solo perfil y afinidades. `role`, `passwordHash`, `salt` e
// `iterations` se rechazan aquí (fallo cerrado): el rol nunca cambia desde la UI y las
// credenciales rotan únicamente vía `updateAccountCredentials`.
const MUTABLE_FIELDS = Object.freeze(['profile', 'affinities']);
const FORBIDDEN_PATCH_FIELDS = Object.freeze(['role', 'passwordHash', 'salt', 'iterations', 'hash', 'id', 'email']);

export function patchAccount(id, patch) {
  const entries = Object.entries(patch ?? {});
  const rejected = entries.find(([key]) => FORBIDDEN_PATCH_FIELDS.includes(key) || !MUTABLE_FIELDS.includes(key));
  if (rejected) throw new Error(`Campo no permitido: ${rejected[0]}`);
  accountsStore.setState(({ accounts }) => ({
    accounts: accounts.map((account) => (account.id === id ? { ...account, ...Object.fromEntries(entries) } : account)),
  }));
}

/** Rotación de credenciales con validación de forma (hash 64hex, iteraciones finitas acotadas). */
export function updateAccountCredentials(id, { salt, iterations, passwordHash }) {
  if (typeof salt !== 'string' || salt.length === 0 || salt.length > 128) {
    throw new Error('Credenciales no válidas.');
  }
  if (!Number.isFinite(iterations) || iterations <= 0 || iterations > ITERATIONS_MAX) {
    throw new Error('Credenciales no válidas.');
  }
  if (typeof passwordHash !== 'string' || !HASH_HEX64.test(passwordHash)) {
    throw new Error('Credenciales no válidas.');
  }
  accountsStore.setState(({ accounts }) => ({
    accounts: accounts.map((account) => (
      account.id === id ? { ...account, salt, iterations: Math.floor(iterations), passwordHash } : account
    )),
  }));
}

export function removeAccount(id) {
  accountsStore.setState(({ accounts }) => ({ accounts: accounts.filter((account) => account.id !== id) }));
}

export function setLockout(email, lockout) {
  accountsStore.setState(({ lockouts }) => ({ lockouts: { ...lockouts, [normalizeEmail(email)]: lockout } }));
}

export function clearLockout(email) {
  accountsStore.setState(({ lockouts }) => {
    const { [normalizeEmail(email)]: _removed, ...rest } = lockouts;
    return { lockouts: rest };
  });
}
