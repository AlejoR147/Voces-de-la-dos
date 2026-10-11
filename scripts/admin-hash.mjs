#!/usr/bin/env node
/**
 * Generates the administrator credentials used by the app (see src/config/admin.js).
 *
 *   npm run admin:hash -- --email admin@example.org            random password, printed once
 *   ADMIN_PASSWORD=Secreta12345678 npm run admin:hash -- --email a@b.co
 *   npm run admin:hash -- --email a@b.co --password "Secreta12345678"   (discouraged)
 *   npm run admin:hash -- --email a@b.co --write                writes .env.local (git-ignored)
 *
 * Only the salted PBKDF2 hash goes into the environment; the password is never stored.
 * `--password` deja la clave en el historial del shell: prefiere `ADMIN_PASSWORD` o la
 * generación aleatoria. `--write` nunca sobrescribe a ciegas: hace backup y mezcla.
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const DEFAULT_ITERATIONS = 150000;
const ITERATIONS_MAX = 1000000;
const ADMIN_PASSWORD_MIN = 12;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function option(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--')
    ? process.argv[index + 1]
    : fallback;
}

const email = option('email', 'admin@santacruz.local').trim().toLowerCase();
if (email.length === 0 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  fail('Correo no válido.');
}
const name = option('name', 'Administración').trim().slice(0, 80) || 'Administración';

// `--iterations` validado como entero finito y acotado (un valor gigante = DoS de CPU en login).
const iterations = (() => {
  const value = Number(option('iterations', String(DEFAULT_ITERATIONS)));
  if (!Number.isInteger(value) || value <= 0 || value > ITERATIONS_MAX) {
    fail(`--iterations debe ser un entero entre 1 y ${ITERATIONS_MAX}.`);
  }
  return value;
})();

const strongEnough = (candidate) => candidate.length >= ADMIN_PASSWORD_MIN
  && /[A-Za-z]/.test(candidate) && /\d/.test(candidate);

const passwordFromFlag = option('password');
const passwordFromEnv = (process.env.ADMIN_PASSWORD ?? '').trim();
if (passwordFromFlag) {
  console.warn('Aviso: --password deja la contraseña en el historial del shell. Prefiere ADMIN_PASSWORD=... o deja que se genere una aleatoria.');
}
if (passwordFromFlag || passwordFromEnv) {
  var password = passwordFromFlag || passwordFromEnv;
  var generated = false;
  if (!strongEnough(password)) {
    fail(`La contraseña de administración debe tener al menos ${ADMIN_PASSWORD_MIN} caracteres con letras y números.`);
  }
} else {
  var password = '';
  var generated = true;
  for (let attempt = 0; attempt < 50 && !strongEnough(password); attempt += 1) {
    password = randomBytes(12).toString('base64url');
  }
  if (!strongEnough(password)) fail('No se pudo generar una contraseña válida, inténtalo de nuevo.');
}
const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');

const lines = [
  `VITE_ADMIN_EMAIL=${email}`,
  `VITE_ADMIN_NAME=${name}`,
  `VITE_ADMIN_SALT=${salt}`,
  `VITE_ADMIN_HASH=${hash}`,
  `VITE_ADMIN_ITERATIONS=${iterations}`,
];

if (process.argv.includes('--write')) {
  const target = '.env.local';
  if (existsSync(target)) {
    // Backup + merge: conserva claves ajenas y reemplaza solo las VITE_ADMIN_*.
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const previous = readFileSync(target, 'utf8');
    writeFileSync(`.env.local.bak-${stamp}`, previous, 'utf8');
    console.log(`Copia de seguridad creada (.env.local.bak-${stamp}).`);
    const kept = previous.split('\n').filter((line) => line.trim() !== '' && !line.startsWith('VITE_ADMIN_'));
    writeFileSync(target, `${[...kept, ...lines].join('\n')}\n`, 'utf8');
  } else {
    writeFileSync(target, `${lines.join('\n')}\n`, 'utf8');
  }
  console.log('Escrito en .env.local (ignorado por git). Reinicia el servidor de desarrollo.');
} else {
  console.log(lines.join('\n'));
}

console.log(`\nCorreo: ${email}`);
if (generated) console.log(`Contraseña generada (guárdala ahora, no se vuelve a mostrar): ${password}`);
