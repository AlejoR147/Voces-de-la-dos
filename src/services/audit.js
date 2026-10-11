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
  profile_updated: 'Perfil actualizado',
  event_created: 'Evento enviado a revisión',
  suggestion_created: 'Propuesta enviada',
  team_created: 'Equipo creado',
  enrollment_changed: 'Inscripción',
  admin_action: 'Acción de administración',
  denied: 'Acción no autorizada',
});

/**
 * Minimización de PII: la vista de Moderación y el CSV nunca muestran el correo
 * completo (`a***@dominio`). El registro crudo sigue en localStorage del propio
 * navegador; al eliminar la cuenta se purgan sus entradas (ver `purgeUserEntries`).
 */
export function maskEmail(email) {
  const value = String(email ?? '');
  const at = value.indexOf('@');
  if (at <= 1) return value ? '***' : '';
  return `${value[0]}***@${value.slice(at + 1)}`;
}

/** Local audit trail. Without a backend it can be cleared from the browser, so it is informative, not tamper-proof. */
export function logEvent(type, { email = '', role = '', detail = '' } = {}) {
  auditStore.setState(({ entries }) => ({
    entries: [{ at: new Date().toISOString(), type, email: String(email).slice(0, 120), role, detail: String(detail).slice(0, 200) }, ...entries].slice(0, SECURITY.auditLogLimit),
  }));
}

/** Borra las entradas asociadas a un correo (derecho al olvido local en `deleteAccount`). */
export function purgeUserEntries(email) {
  const key = String(email ?? '').trim().toLowerCase();
  if (!key) return;
  auditStore.setState(({ entries }) => ({
    entries: entries.filter((entry) => String(entry.email ?? '').trim().toLowerCase() !== key),
  }));
}
