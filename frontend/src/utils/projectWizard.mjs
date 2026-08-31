export function projectWizardHint(data = {}, step = 1) {
  if (!String(data.name || '').trim()) return 'Enter a project name to continue.';
  if (!data.category) return 'Choose a project category to continue.';
  if (step >= 2 && !data.workflow) return 'Choose a workflow to continue.';
  if (step >= 2 && data.workflow === 'custom' && !data.selectedAgents?.length) return 'Select at least one agent for your custom team.';
  return '';
}
