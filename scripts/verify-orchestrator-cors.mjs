import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const backendSource = fs.readFileSync(path.join(root, 'backend', 'server.js'), 'utf8');
const orchestratorSource = fs.readFileSync(
  path.join(root, 'frontend', 'src', 'components', 'StudioOrchestratorV2.jsx'),
  'utf8'
);

const requiredHeader = 'x-pipeline-session';
const corsHeaderMatch = backendSource.match(/allowedHeaders:\s*\[([^\]]+)\]/i);

if (!corsHeaderMatch) {
  throw new Error('Backend CORS allowedHeaders configuration was not found.');
}

const allowedHeaders = corsHeaderMatch[1].toLowerCase();
if (!allowedHeaders.includes(requiredHeader)) {
  throw new Error(`Backend CORS must allow ${requiredHeader}.`);
}

if (!orchestratorSource.toLowerCase().includes(`headers['${requiredHeader}']`)) {
  throw new Error(`Studio orchestrator no longer sends ${requiredHeader}; update this contract check.`);
}

console.log('Orchestrator CORS contract verified.');
