// Creation inventory is not audience analytics. Count only the supplied project
// and asset records; never extrapolate streams, listeners, reach, or revenue.
export function studioCreationCounts(projects) {
  const records = Array.isArray(projects) ? projects.filter(project => project && typeof project === 'object') : [];
  return {
    projectCount: records.length,
    assetCount: records.reduce((total, project) => total + (Array.isArray(project.assets)
      ? project.assets.filter(asset => asset && typeof asset === 'object').length : 0), 0)
  };
}
