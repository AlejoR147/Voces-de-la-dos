import { createStore } from '../core/store.js';
import { STORAGE_KEYS } from '../config/constants.js';

/**
 * Local account registry (demo persistence, no server). Stored accounts are never allowed to hold the
 * admin role: administrators only exist through the build-time credentials in `config/admin.js`.
 */
export const accountsStore = createStore(
  { accounts: [], lockouts: {} },
  { persistKey: STORAGE_KEYS.accounts },
);

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const findAccountByEmail = (email) => accountsStore.getState().accounts
  .find((account) => account.email === normalizeEmail(email));

export const findAccountById = (id) => accountsStore.getState().accounts.find((account) => account.id === id);

export function saveAccount(account) {
  accountsStore.setState(({ accounts }) => ({ accounts: [...accounts, account] }));
}

export function patchAccount(id, patch) {
  accountsStore.setState(({ accounts }) => ({
    accounts: accounts.map((account) => (account.id === id ? { ...account, ...patch } : account)),
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
