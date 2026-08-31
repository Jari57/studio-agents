const resourceRoutes = new Set(['#/legal', '#/whitepapers', '#/dna', '#/vocals', '#/billboard', '#/campaign']);

export function safeResourceReturnHash(hash) {
  return typeof hash === 'string' && /^#\/studio(?:\/[a-z0-9_-]+)?$/i.test(hash) ? hash : '#/';
}

export function resourceNavigationContext(previousHash, nextHash, previousReturn = '#/', entryState = null) {
  const historyState = entryState && typeof entryState === 'object' ? { ...entryState } : {};
  if (!resourceRoutes.has(nextHash)) {
    delete historyState.studioResourceReturn;
    return { returnHash: safeResourceReturnHash(previousReturn), historyState };
  }
  const saved = historyState.studioResourceReturn;
  const returnHash = saved?.page === nextHash
    ? safeResourceReturnHash(saved.returnHash)
    : resourceRoutes.has(previousHash)
      ? safeResourceReturnHash(previousReturn)
      : safeResourceReturnHash(previousHash);
  historyState.studioResourceReturn = { page: nextHash, returnHash };
  return { returnHash, historyState };
}
