export function isStaleChunkError(error) {
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(error?.message || '');
}

// Only called by an explicit user click. Never reload during a paid generation
// or discard unsaved work merely because a deployment changed a chunk URL.
export function recoverSection(error, { reload, reset }) {
  if (isStaleChunkError(error)) reload();
  else reset();
}
