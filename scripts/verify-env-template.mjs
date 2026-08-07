import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const templatePath = resolve('backend/.env.example');
if (!existsSync(templatePath)) {
  throw new Error('backend/.env.example is required so deployments have a documented configuration contract.');
}

const template = readFileSync(templatePath, 'utf8');
const requiredDocumentation = [
  'GEMINI_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'NODE_ENV',
];

const undocumented = requiredDocumentation.filter((name) => !new RegExp(`^${name}=`, 'm').test(template));
if (undocumented.length) {
  throw new Error(`Missing documented backend environment variables: ${undocumented.join(', ')}`);
}

console.log('Backend environment template is present and documents the required service contract.');
