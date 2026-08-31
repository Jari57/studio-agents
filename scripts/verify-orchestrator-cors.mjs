import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const backendSource = fs.readFileSync(path.join(root, 'backend', 'server.js'), 'utf8');
const corsSource = fs.readFileSync(path.join(root, 'backend', 'services', 'corsPolicy.js'), 'utf8');
const orchestratorSource = fs.readFileSync(
  path.join(root, 'frontend', 'src', 'components', 'StudioOrchestratorV2.jsx'),
  'utf8'
);

const requiredHeader = 'x-pipeline-session';
if (!backendSource.includes('app.use(cors(createCorsPolicy(allowedOrigins, logger)))')) {
  throw new Error('Production must use the tested CORS policy.');
}
const corsHeaderMatch = corsSource.match(/allowedHeaders:\s*\[([^\]]+)\]/i);

if (!corsHeaderMatch) {
  throw new Error('Backend CORS allowedHeaders configuration was not found.');
}

const allowedHeaders = corsHeaderMatch[1].toLowerCase();
if (!allowedHeaders.includes(requiredHeader)) {
  throw new Error(`Backend CORS must allow ${requiredHeader}.`);
}
if (!allowedHeaders.includes('idempotency-key')) {
  throw new Error('Backend CORS must allow idempotency-key for authenticated paid generation.');
}

if (!orchestratorSource.toLowerCase().includes(`headers['${requiredHeader}']`)) {
  throw new Error(`Studio orchestrator no longer sends ${requiredHeader}; update this contract check.`);
}

console.log('Orchestrator CORS contract verified.');
