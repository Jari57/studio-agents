const timestamp = value => {
  if (typeof value === 'number') return value;
  if (value?.seconds) return value.seconds * 1000;
  return Date.parse(value || '') || 0;
};

export function saveProjectChoices(projects, search = '') {
  const query = search.trim().toLocaleLowerCase();
  return (Array.isArray(projects) ? projects : [])
    .filter(project => project?.id && (project.name || project.title))
    .filter(project => String(project.name || project.title).toLocaleLowerCase().includes(query))
    .slice()
    .sort((a, b) => timestamp(b.updatedAt || b.lastModified || b.createdAt) - timestamp(a.updatedAt || a.lastModified || a.createdAt));
}
