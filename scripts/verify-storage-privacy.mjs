import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../backend/server.js', import.meta.url), 'utf8');
const violations = [];

if (/\.makePublic\s*\(/.test(source)) {
  violations.push('User uploads must not call Firebase Storage makePublic().');
}

if (!/firebaseStorageDownloadTokens\s*:/.test(source)) {
  violations.push('User uploads must use a Firebase download capability token.');
}

if (!/firebasestorage\.googleapis\.com\/v0\/b\//.test(source)) {
  violations.push('User uploads must return Firebase download URLs, not object-public URLs.');
}

if (violations.length) {
  console.error('Storage privacy contract failed:\n- ' + violations.join('\n- '));
  process.exit(1);
}

console.log('Storage privacy contract passed.');
