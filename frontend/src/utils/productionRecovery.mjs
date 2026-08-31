// Account authorization belongs to the API. Within that account, a job may
// restore only into the exact project it was created for. Unassigned legacy
// jobs are never allowed to replace a named project's brief or media.
export function productionJobMatchesProject(job, projectId) {
  if (!job || typeof job !== 'object') return false;
  return (job.projectId || null) === (projectId || null);
}
