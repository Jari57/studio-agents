import { readFile } from 'node:fs/promises';

const [server, rules] = await Promise.all([
  readFile(new URL('../backend/server.js', import.meta.url), 'utf8'),
  readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
]);
const violations = [];

for (const route of ['/api/projects/sync', '/api/projects']) {
  const pattern = new RegExp(`app\\.(?:post|get)\\('${route.replace(/[/.]/g, '\\$&')}', verifyFirebaseToken, requireAuth`);
  if (!pattern.test(server)) violations.push(`${route} must require a verified Firebase user.`);
}
for (const route of ["app.post('/api/projects', verifyFirebaseToken, requireAuth", "app.put('/api/projects/:id', verifyFirebaseToken, requireAuth", "app.delete('/api/projects/:id', verifyFirebaseToken, requireAuth"]) {
  if (!server.includes(route)) violations.push(`${route} must require a verified Firebase user.`);
}
if (/req\.user\?\.uid\s*\|\|\s*userId/.test(server)) {
  violations.push('Project routes must not fall back to caller-supplied user IDs.');
}
const userRuleStart = rules.indexOf('match /users/{userId} {');
const firstSubcollection = rules.indexOf('match /projects/', userRuleStart);
const userDocumentRule = userRuleStart >= 0 && firstSubcollection > userRuleStart
  ? rules.slice(userRuleStart, firstSubcollection)
  : '';
if (!userDocumentRule) {
  violations.push('The root user document rule could not be located.');
} else if (/allow read, write: if request\.auth != null && request\.auth\.uid == userId/.test(userDocumentRule)) {
  violations.push('User documents must not permit unrestricted owner writes.');
}
if (!/affectedKeys\(\)\.hasOnly/.test(rules)) {
  violations.push('User-profile writes must use an explicit safe field allowlist.');
}
if (violations.length) {
  console.error('Project access contract failed:\n- ' + violations.join('\n- '));
  process.exit(1);
}
console.log('Project access contract passed.');
