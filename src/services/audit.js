import { createStore } from '../core/store.js';
import { SECURITY, STORAGE_KEYS } from '../config/constants.js';

export const auditStore = createStore({ entries: [] }, { persistKey: STORAGE_KEYS.audit });

export const AUDIT_LABELS = Object.freeze({
  register: 'Cuenta creada',
  login_ok: 'Inicio de sesión',
  login_fail: 'Intento fallido',
  locked: 'Acceso bloqueado',
  logout: 'Cierre de sesión',
  session_expired: 'Sesión expirada',
  password_changed: 'Contraseña cambiada',
  account_deleted: 'Cuenta eliminada',
  admin_action: 'Acción de administración',
  denied: 'Acción no autorizada',
});

/** Local audit trail. Without a backend it can be cleared from the browser, so it is informative, not tamper-proof. */
export function logEvent(type, { email = '', role = '', detail = '' } = {}) {
  auditStore.setState(({ entries }) => ({
    entries: [{ at: new Date().toISOString(), type, email: String(email).slice(0, 120), role, detail: String(detail).slice(0, 200) }, ...entries].slice(0, SECURITY.auditLogLimit),
  }));
}
