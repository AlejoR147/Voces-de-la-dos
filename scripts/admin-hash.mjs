#!/usr/bin/env node
/**
 * Generates the administrator credentials used by the app (see src/config/admin.js).
 *
 *   npm run admin:hash -- --email admin@example.org            random password, printed once
 *   npm run admin:hash -- --email a@b.co --password "Secreta123"
 *   npm run admin:hash -- --email a@b.co --write                writes .env.local (git-ignored)
 *
 * Only the salted PBKDF2 hash goes into the environment; the password is never stored.
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const ITERATIONS = 150000;

function option(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--')
    ? process.argv[index + 1]
    : fallback;
}

const email = option('email', 'admin@santacruz.local').toLowerCase();
const name = option('name', 'Administración');
const generated = !option('password');
const password = option('password') || randomBytes(9).toString('base64url');
const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256').toString('hex');

const lines = [
  `VITE_ADMIN_EMAIL=${email}`,
  `VITE_ADMIN_NAME=${name}`,
  `VITE_ADMIN_SALT=${salt}`,
  `VITE_ADMIN_HASH=${hash}`,
  `VITE_ADMIN_ITERATIONS=${ITERATIONS}`,
];

if (process.argv.includes('--write')) {
  writeFileSync('.env.local', `${lines.join('\n')}\n`, 'utf8');
  console.log('Escrito en .env.local (ignorado por git). Reinicia el servidor de desarrollo.');
} else {
  console.log(lines.join('\n'));
}

console.log(`\nCorreo: ${email}`);
if (generated) console.log(`Contraseña generada (guárdala ahora, no se vuelve a mostrar): ${password}`);
