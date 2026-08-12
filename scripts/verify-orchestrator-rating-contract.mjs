import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const orchestratorSource = fs.readFileSync(
  path.join(root, 'frontend', 'src', 'components', 'StudioOrchestratorV2.jsx'),
  'utf8'
);

const failures = [];

if (orchestratorSource.includes('gradeGeneration(slot, data.output, songIdea)')) {
  failures.push('Successful generation must not automatically start an A&R review.');
}

if (!orchestratorSource.includes('onGradeAr={() => gradeGeneration(slot.key, outputs[slot.key], songIdea)}')) {
  failures.push('Generator cards must expose the explicit A&R review action.');
}

if (!orchestratorSource.includes('const [showArReview, setShowArReview] = useState(false)')) {
  failures.push('A&R reviews must remain collapsed by default.');
}

if (!orchestratorSource.includes('showArReview && (arGrade || isGradingAr) && output')) {
  failures.push('The A&R scorecard must render only after the user opens it.');
}

if (failures.length > 0) {
  throw new Error(`Orchestrator rating contract failed:\n- ${failures.join('\n- ')}`);
}

console.log('Orchestrator rating contract verified. Ratings are optional and non-blocking.');
