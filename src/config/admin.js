/**
 * Administrator credentials come from build-time env vars (see .env.example and `npm run admin:hash`).
 * Only a salted PBKDF2 hash is shipped, never the password. Note: any value bundled into a client app is
 * readable by the user, so this is a demo-grade control until authentication moves to a real backend.
 *
 * Riesgo aceptado (2026-10-10): el hash viaja en el bundle y la "sesión admin" vive solo en memoria;
 * sin backend no hay secreto real ni revocación en servidor. Fecha objetivo de migración a un backend
 * con autenticación de verdad: 2027-03-31. A partir de esa fecha, este mecanismo queda desautorizado.
 */
const env = import.meta.env;

export const ADMIN_CONFIG = Object.freeze({
  email: (env.VITE_ADMIN_EMAIL ?? '').trim().toLowerCase(),
  name: env.VITE_ADMIN_NAME || 'Administración',
  salt: env.VITE_ADMIN_SALT ?? '',
  hash: env.VITE_ADMIN_HASH ?? '',
  iterations: Number(env.VITE_ADMIN_ITERATIONS) || 150000,
});

export const ADMIN_ENABLED = Boolean(ADMIN_CONFIG.email && ADMIN_CONFIG.salt && ADMIN_CONFIG.hash);
