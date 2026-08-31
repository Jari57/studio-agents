import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createProjectSaveQueue, mergeGeneratedProject, applySavedProjectRevision,
  replaceUploadedMedia, hasUnpersistedMedia, requireDurableSaveResult, projectSyncSignature,
  cloudProjectSnapshot, prepareProjectConflictRebase
} from '../src/utils/projectPersistence.mjs';

test('parallel media completions serialize and persist the combined asset history', async () => {
  const enqueue = createProjectSaveQueue();
  const baseline = { id: 'p', name: 'Original', assets: [{ id: 'lyrics', content: 'Lyrics' }] };
  let current = baseline;
  const saved = [];
  let release;
  const firstWrite = new Promise(resolve => { release = resolve; });
  const save = (asset, hold = false) => enqueue('u:p', async () => {
    current = mergeGeneratedProject(current, { ...baseline, assets: [...baseline.assets, asset] }, baseline);
    if (hold) await firstWrite;
    saved.push(current.assets.map(a => a.id));
    return true;
  });
  const audio = save({ id: 'audio', audioUrl: 'https://example.test/audio' }, true);
  const image = save({ id: 'image', imageUrl: 'https://example.test/image' });
  await Promise.resolve();
  assert.equal(saved.length, 0);
  release();
  assert.deepEqual(await Promise.all([audio, image]), [true, true]);
  assert.deepEqual(saved, [['lyrics', 'audio'], ['lyrics', 'audio', 'image']]);
});

test('failed writes do not poison retry or block other accounts and projects', async () => {
  const enqueue = createProjectSaveQueue();
  let release;
  const hold = new Promise(resolve => { release = resolve; });
  const blocked = enqueue('alice:p', () => hold);
  assert.equal(await enqueue('bob:p', async () => 'bob'), 'bob');
  assert.equal(await enqueue('alice:other', async () => 'other'), 'other');
  release(false);
  assert.equal(await blocked, false);
  await assert.rejects(enqueue('alice:p', async () => { throw new Error('offline'); }), /offline/);
  assert.equal(await enqueue('alice:p', async () => true), true);
});

test('stale generated snapshot preserves edits, versions, and full text beyond matching prefixes', () => {
  const prefix = 'a'.repeat(210);
  const baseline = { id: 'p', name: 'Old', assets: [{ id: 'one', content: prefix + 'first', title: 'Old' }] };
  const current = { ...baseline, name: 'Edited', assets: [{ ...baseline.assets[0], title: 'Edited' }, { id: 'master', audioUrl: 'master.wav' }] };
  const incoming = { ...baseline, assets: [...baseline.assets, { id: 'two', content: prefix + 'second' }] };
  const merged = mergeGeneratedProject(current, incoming, baseline);
  assert.equal(merged.name, 'Edited');
  assert.equal(merged.assets[0].title, 'Edited');
  assert.deepEqual(merged.assets.map(a => a.id), ['one', 'master', 'two']);
});

for (const order of [['audio', 'image'], ['image', 'audio']]) {
  test(`media URL maps merge per key in ${order.join(' then ')} completion order`, () => {
    const baseline = { id: 'p', assets: [], mediaUrls: { audio: 'a0', image: 'i0' } };
    let current = baseline;
    for (const key of order) current = mergeGeneratedProject(current, {
      ...baseline, mediaUrls: { ...baseline.mediaUrls, [key]: key === 'audio' ? 'a1' : 'i1' }
    }, baseline);
    assert.deepEqual(current.mediaUrls, { audio: 'a1', image: 'i1' });
  });
}

test('upload acknowledgement preserves later edits and adopts only unchanged media fields', () => {
  const submitted = { id: 'p', name: 'Old', assets: [{ id: 'a', audioUrl: 'blob:old', title: 'Before' }] };
  const persisted = { ...submitted, assets: [{ ...submitted.assets[0], audioUrl: 'https://example.test/saved' }] };
  const current = { ...submitted, name: 'New', assets: [{ ...submitted.assets[0], title: 'After' }, { id: 'b' }] };
  const acknowledged = applySavedProjectRevision(current, submitted, persisted, '2026-08-31T12:00:00.000Z');
  assert.equal(acknowledged.name, 'New');
  assert.equal(acknowledged.assets[0].title, 'After');
  assert.equal(acknowledged.assets[0].audioUrl, 'https://example.test/saved');
  assert.equal(acknowledged.assets.length, 2);
  const newerMedia = { ...current, assets: [{ id: 'a', audioUrl: 'blob:newer' }] };
  assert.equal(applySavedProjectRevision(newerMedia, submitted, persisted).assets[0].audioUrl, 'blob:newer');
  assert.equal(applySavedProjectRevision({ id: 'other' }, submitted, persisted).id, 'other');
});

test('acknowledgement never rolls a newer concurrency token backwards', () => {
  const current = { id: 'p', assets: [], syncedAt: '2026-08-31T13:00:00.000Z' };
  assert.equal(applySavedProjectRevision(current, current, current, '2026-08-31T12:00:00.000Z').syncedAt, current.syncedAt);
});

test('nested media references normalize to uploaded URLs, unresolved payloads fail closed', () => {
  const project = { assets: [{ audioUrl: 'blob:a' }], mediaUrls: { audio: 'blob:a' }, nested: [{ image: 'data:image/png;base64,A' }] };
  const partial = replaceUploadedMedia(project, new Map([['blob:a', 'https://example.test/a.wav']]));
  assert.equal(partial.mediaUrls.audio, partial.assets[0].audioUrl);
  assert.equal(hasUnpersistedMedia(partial), true);
  assert.equal(hasUnpersistedMedia(replaceUploadedMedia(partial, new Map([['data:image/png;base64,A', 'https://example.test/a.png']]))), false);
  assert.equal(hasUnpersistedMedia({ nested: '[Media Data Pruned to Save Space]' }), true);
  assert.equal(project.mediaUrls.audio, 'blob:a');
});

test('HTTP success alone is not a durable save acknowledgement', () => {
  for (const result of [{}, { success: false }, { success: true }, { success: true, updatedAt: 'now', warning: 'Cloud storage not available' }]) {
    assert.throws(() => requireDurableSaveResult(result), /did not confirm/);
  }
  assert.equal(requireDurableSaveResult({ success: true, updatedAt: '2026-08-31T12:00:00Z' }), '2026-08-31T12:00:00Z');
});

test('acknowledgement-only updates do not trigger autosync loops; real edits and accounts do', () => {
  const before = [{ id: 'p', name: 'Old', syncedAt: 'one', assets: [] }];
  const acknowledged = [{ ...before[0], syncedAt: 'two' }];
  assert.equal(projectSyncSignature('u', before), projectSyncSignature('u', acknowledged));
  assert.notEqual(projectSyncSignature('u', before), projectSyncSignature('v', before));
  assert.notEqual(projectSyncSignature('u', before), projectSyncSignature('u', [{ ...before[0], name: 'New' }]));
});

test('orchestrator adapters return durable promises; cloud saver never bypasses conflict locks or prunes media', () => {
  const source = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  const saver = source.slice(source.indexOf('async function saveProjectToCloud'), source.indexOf('// Shared generated-project adapter'));
  const adapters = source.slice(source.indexOf('            onSaveToProject={project =>'), source.indexOf('            onUpdateCreations='));
  assert.match(adapters, /onSaveToProject=\{project => saveOrchestratorProject/);
  assert.match(adapters, /onCreateProject=\{project => saveOrchestratorProject/);
  assert.doesNotMatch(adapters, /setTimeout|toast\.success|setProjects/);
  assert.doesNotMatch(saver, /pruneLargeProjectData|retryResponse|retryResult/);
  assert.match(saver, /response\.status === 409[\s\S]*?throw new Error/);
  assert.match(saver, /requireDurableSaveResult\(result\)/);
  assert.match(saver, /savingUser\.uid !== uid/);
  assert.match(saver, /if \(!stillSameUser\(\)\) return false/);
  assert.match(saver, /catch \(upErr\)[\s\S]*?throw new Error/);
});

function actualSaverHarness({ project, fetchImpl, uploadImpl, getIdToken = async () => 'original-token' }) {
  const source = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  const saver = source.slice(source.indexOf('async function saveProjectToCloud'), source.indexOf('// Shared generated-project adapter')).trim().replace(/;$/, '');
  const state = { projects: [project], selected: project, errors: [], calls: [] };
  const auth = { currentUser: { uid: 'alice', getIdToken } };
  const projectStateRef = { current: { uid: 'alice', projects: state.projects } };
  const deps = {
    auth, projectStateRef, replaceUploadedMedia, hasUnpersistedMedia, requireDurableSaveResult, applySavedProjectRevision,
    cloudProjectSnapshot, prepareProjectConflictRebase,
    projectCloudSaveQueueRef: { current: createProjectSaveQueue() },
    projectConflictPendingRef: { current: new Map() },
    uploadBase64: uploadImpl || (async () => ({ url: 'https://example.test/saved.png', path: 'alice/art' })),
    uploadFile: uploadImpl || (async () => ({ url: 'https://example.test/saved.png', path: 'alice/art' })),
    BACKEND_URL: 'https://backend.test',
    fetch: async (...args) => { state.calls.push(args); return fetchImpl(...args); },
    devLog: () => {}, devWarn: () => {}, toast: { error: value => state.errors.push(value) },
    badgeTracker: { trackProjectSave: () => {} },
    setProjects: update => { state.projects = update(state.projects); },
    setSelectedProject: update => { state.selected = update(state.selected); }
  };
  // Execute only the existing saver against isolated transport/state doubles;
  // no browser, Firebase, provider, or production data is used by these tests.
  const save = new Function(...Object.keys(deps), `return (${saver});`)(...Object.values(deps));
  const adapterSource = source.slice(source.indexOf('async function saveOrchestratorProject'), source.indexOf('// Sync all projects to cloud via backend API')).trim();
  const adapterDeps = { ...deps, mergeGeneratedProject, saveProjectToCloud: save, orchestratorSaveQueueRef: { current: createProjectSaveQueue() } };
  const adapter = new Function(...Object.keys(adapterDeps), `return (${adapterSource});`)(...Object.values(adapterDeps));
  return { state, auth, projectStateRef, save, adapter, pendingConflicts: deps.projectConflictPendingRef.current };
}

test('real saver issues one guarded request on conflict and retains the complete local project', async () => {
  const project = { id: 'p', assets: [{ id: 'a', audioUrl: 'https://example.test/a.wav' }], syncedAt: '2026-08-31T11:00:00Z' };
  const h = actualSaverHarness({ project, fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: 'Conflict' }) }) });
  assert.equal(await h.save('alice', project), false);
  assert.equal(h.state.calls.length, 1);
  assert.equal(JSON.parse(h.state.calls[0][1].body).lastUpdatedAt, project.syncedAt);
  assert.equal(h.state.projects[0], project);
  assert.match(h.state.errors[0], /Nothing was overwritten/);
});

test('real saver rejects a failed media upload before sending or pruning the document', async () => {
  const project = { id: 'p', assets: [{ id: 'a', imageUrl: 'data:image/png;base64,A' }] };
  const h = actualSaverHarness({ project, uploadImpl: async () => { throw new Error('storage offline'); }, fetchImpl: async () => assert.fail('No document should be sent') });
  assert.equal(await h.save('alice', project), false);
  assert.equal(h.state.calls.length, 0);
  assert.equal(h.state.projects[0].assets[0].imageUrl, 'data:image/png;base64,A');
  assert.match(h.state.errors[0], /Media upload failed/);
});

test('real saver rejects an unavailable-cloud success envelope', async () => {
  const project = { id: 'p', assets: [] };
  const h = actualSaverHarness({ project, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ success: true, warning: 'Cloud storage not available' }) }) });
  assert.equal(await h.save('alice', project), false);
  assert.equal(h.state.projects[0], project);
});

test('real saver adopts durable media and acknowledged revision without losing a concurrent edit', async () => {
  const project = { id: 'p', name: 'Before', assets: [{ id: 'a', imageUrl: 'data:image/png;base64,A' }], mediaUrls: { image: 'data:image/png;base64,A' } };
  const h = actualSaverHarness({ project, fetchImpl: async () => {
    const newer = { ...project, name: 'During save', assets: [...project.assets, { id: 'b' }] };
    h.state.projects = [newer]; h.state.selected = newer; h.projectStateRef.current.projects = [newer];
    return { ok: true, status: 200, json: async () => ({ success: true, updatedAt: '2026-08-31T12:00:00.000Z' }) };
  } });
  assert.equal(await h.save('alice', project), true);
  assert.equal(h.state.projects[0].name, 'During save');
  assert.equal(h.state.projects[0].assets.length, 2);
  assert.equal(h.state.projects[0].assets[0].imageUrl, 'https://example.test/saved.png');
  assert.equal(h.state.projects[0].mediaUrls.image, 'https://example.test/saved.png');
  assert.equal(h.state.projects[0].syncedAt, '2026-08-31T12:00:00.000Z');
});

test('real saver aborts account switches before sending and never obtains the new user token', async () => {
  const project = { id: 'p', assets: [] };
  let release;
  const token = new Promise(resolve => { release = resolve; });
  const h = actualSaverHarness({ project, getIdToken: () => token, fetchImpl: async () => assert.fail('Do not send after account switch') });
  const saving = h.save('alice', project);
  h.auth.currentUser = { uid: 'bob', getIdToken: () => assert.fail('Do not use the new account token') };
  h.projectStateRef.current.uid = 'bob';
  release('alice-token');
  assert.equal(await saving, false);
  assert.equal(h.state.calls.length, 0);
  assert.equal(h.state.errors.length, 0);
});

test('real saver serializes manual and automatic writes, then reads the newest assets and lock token', async () => {
  const project = { id: 'p', assets: [{ id: 'a' }], syncedAt: '2026-08-31T11:00:00.000Z' };
  let started; let release;
  const startedRequest = new Promise(resolve => { started = resolve; });
  const holdFirst = new Promise(resolve => { release = resolve; });
  let active = 0; let maxActive = 0;
  const h = actualSaverHarness({ project, fetchImpl: async () => {
    active++; maxActive = Math.max(maxActive, active);
    if (h.state.calls.length === 1) { started(); await holdFirst; }
    active--;
    return { ok: true, status: 200, json: async () => ({ success: true, updatedAt: '2026-08-31T12:00:00.000Z' }) };
  } });
  const manual = h.save('alice', project);
  await startedRequest;
  const automatic = h.save('alice', project, { latest: true, silent: true });
  const edited = { ...project, assets: [...project.assets, { id: 'b' }] };
  h.state.projects = [edited]; h.state.selected = edited; h.projectStateRef.current.projects = [edited];
  assert.equal(h.state.calls.length, 1);
  release();
  assert.deepEqual(await Promise.all([manual, automatic]), [true, true]);
  assert.equal(maxActive, 1);
  const second = JSON.parse(h.state.calls[1][1].body);
  assert.equal(second.lastUpdatedAt, '2026-08-31T12:00:00.000Z');
  assert.deepEqual(second.project.assets.map(a => a.id), ['a', 'b']);
});

test('a successful old-account response cannot replace new-account visible state', async () => {
  const project = { id: 'p', name: 'Alice', assets: [] };
  const bob = { id: 'p', name: 'Bob', assets: [{ id: 'private-bob' }] };
  const h = actualSaverHarness({ project, fetchImpl: async () => {
    h.auth.currentUser = { uid: 'bob', getIdToken: async () => assert.fail('Never acquire Bob token') };
    h.projectStateRef.current = { uid: 'bob', projects: [bob] };
    h.state.projects = [bob]; h.state.selected = bob;
    return { ok: true, status: 200, json: async () => ({ success: true, updatedAt: '2026-08-31T12:00:00.000Z' }) };
  } });
  assert.equal(await h.save('alice', project), true);
  assert.equal(h.state.projects[0], bob);
  assert.equal(h.state.selected, bob);
});

test('real cloud loader replaces embedded client syncedAt with the fetched server version before saving', async () => {
  const source = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  const loader = source.slice(source.indexOf('async function loadProjectsFromCloud'), source.indexOf('// Merge local and cloud projects')).trim().replace(/;$/, '');
  const serverTime = '2026-08-31T12:00:00.041Z';
  const stored = { id: 'p', assets: [], syncedAt: '2026-08-31T12:00:00.000Z', updatedAt: serverTime, serverRevision: serverTime };
  const deps = {
    auth: {}, BACKEND_URL: 'https://backend.test', cloudProjectSnapshot,
    generateId: () => assert.fail('Existing project identity must be kept'), devLog: () => {}, devWarn: () => {},
    toast: { error: message => assert.fail(message) },
    fetch: async () => ({ ok: true, json: async () => ({ projects: [stored] }) })
  };
  const load = new Function(...Object.keys(deps), `return (${loader});`)(...Object.values(deps));
  const [loaded] = await load('alice', null, 'alice-token');
  assert.equal(loaded.syncedAt, serverTime);
  assert.equal(loaded.serverRevision, serverTime);
  const h = actualSaverHarness({ project: loaded, fetchImpl: async (_url, init) => {
    const body = JSON.parse(init.body);
    assert.equal(body.lastUpdatedAt, serverTime);
    assert.equal(body.expectedRevision, serverTime);
    return { ok: true, status: 200, json: async () => ({ success: true, updatedAt: '2026-08-31T12:00:01.000Z', revision: '2026-08-31T12:00:01.000Z' }) };
  } });
  assert.equal(await h.save('alice', loaded), true);
  assert.equal(h.state.calls.length, 1);
  assert.equal(h.state.projects[0].serverRevision, '2026-08-31T12:00:01.000Z');
});

test('conflict rebase preserves remote edits/deletions and new local assets, rejects overlapping edits', () => {
  const baseline = { id: 'p', name: 'Original', assets: [{ id: 'old' }], mediaUrls: { audio: 'a0', image: 'i0' } };
  const remote = { ...baseline, name: 'Remote rename', assets: [{ id: 'remote' }], mediaUrls: { audio: 'a1', image: 'i0' } };
  const local = { ...baseline, assets: [...baseline.assets, { id: 'local' }], mediaUrls: { audio: 'a0', image: 'i1' } };
  const result = prepareProjectConflictRebase(remote, local, baseline);
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.project.name, 'Remote rename');
  assert.deepEqual(result.project.assets.map(a => a.id), ['remote', 'local']);
  assert.deepEqual(result.project.mediaUrls, { audio: 'a1', image: 'i1' });
  assert.equal(prepareProjectConflictRebase(remote, { ...local, name: 'Local rename' }, baseline).project, null);
  assert.equal(prepareProjectConflictRebase(remote, { ...local, assets: [{ id: 'old', title: 'Edited locally' }] }, baseline).project, null);
});

test('real conflict path only stages a safe rebase; explicit adapter retry uses fetched token and preserves remote edits', async () => {
  const baseline = { id: 'p', name: 'Original', assets: [{ id: 'old' }], syncedAt: '2026-08-31T11:00:00Z', serverRevision: '2026-08-31T11:00:00Z' };
  const local = { ...baseline, assets: [...baseline.assets, { id: 'new-art', imageUrl: 'https://example.test/new.png' }] };
  const remoteTime = '2026-08-31T12:00:00.000Z';
  const remote = { ...baseline, name: 'Remote rename', assets: [{ id: 'remote-audio' }], updatedAt: remoteTime, serverRevision: remoteTime };
  let puts = 0;
  const h = actualSaverHarness({ project: local, fetchImpl: async (_url, init) => {
    if (init.method === 'GET') return { ok: true, status: 200, json: async () => ({ project: remote, revision: remoteTime }) };
    puts++;
    if (puts === 1) return { ok: false, status: 409, json: async () => ({ error: 'Conflict' }) };
    const body = JSON.parse(init.body);
    assert.equal(body.expectedRevision, remoteTime);
    assert.equal(body.lastUpdatedAt, remoteTime);
    assert.equal(body.project.name, 'Remote rename');
    assert.deepEqual(body.project.assets.map(a => a.id), ['remote-audio', 'new-art']);
    return { ok: true, status: 200, json: async () => ({ success: true, updatedAt: '2026-08-31T12:01:00Z', revision: '2026-08-31T12:01:00Z' }) };
  } });
  assert.equal(await h.save('alice', local, { baseline }), false);
  assert.equal(puts, 1);
  assert.deepEqual(h.state.calls.map(([, init]) => init.method), ['PUT', 'GET']);
  assert.match(h.state.errors[0], /Click Save Project again/);
  assert.equal(await h.save('alice', h.state.projects[0], { latest: true, silent: true }), false);
  assert.equal(puts, 1, 'Autosync must not confirm a staged conflict merge');
  // The form still has the original title. The adapter must not treat it as a
  // new rename that overwrites the remote title during the explicit retry.
  assert.equal(await h.adapter(local, { uid: 'alice', baseline, selectedId: 'p' }), true);
  assert.equal(puts, 2);
  assert.equal(h.pendingConflicts.has('alice:p'), false);
});

test('actual adapter gives a specific context error without relaxing account guards', async () => {
  const project = { id: 'p', assets: [] };
  const h = actualSaverHarness({ project, fetchImpl: async () => assert.fail('No request expected') });
  await assert.rejects(h.adapter(project, { uid: undefined, baseline: project, selectedId: 'p' }), /sign-in session is not ready/);
  await assert.rejects(h.adapter(project, { uid: 'bob', baseline: project, selectedId: 'p' }), /signed-in account changed/);
  h.projectStateRef.current.uid = 'bob';
  await assert.rejects(h.adapter(project, { uid: 'alice', baseline: project, selectedId: 'p' }), /project session changed/);
  assert.equal(h.state.calls.length, 0);
});

test('actual adapter retains the original cloud baseline across failed autosave and manual retry from optimistic selection', async () => {
  const baseline = { id: 'p', name: 'Original', assets: [{ id: 'old' }], syncedAt: '2026-08-31T11:00:00Z', serverRevision: '2026-08-31T11:00:00Z' };
  const generated = { ...baseline, assets: [...baseline.assets, { id: 'new-image', imageUrl: 'https://example.test/new.png' }] };
  const remoteTime = '2026-08-31T12:00:00.000Z';
  const remote = { ...baseline, name: 'Renamed remotely', assets: [{ id: 'old' }, { id: 'remote-audio' }], updatedAt: remoteTime, serverRevision: remoteTime };
  let gets = 0; let puts = 0;
  const h = actualSaverHarness({ project: baseline, fetchImpl: async (_url, init) => {
    if (init.method === 'GET') {
      gets++;
      if (gets === 1) return { ok: false, status: 503, json: async () => ({ error: 'temporary read outage' }) };
      return { ok: true, status: 200, json: async () => ({ project: remote, revision: remoteTime }) };
    }
    puts++;
    if (puts < 3) return { ok: false, status: 409, json: async () => ({ error: 'Conflict' }) };
    const body = JSON.parse(init.body);
    assert.equal(body.expectedRevision, remoteTime);
    assert.equal(body.project.name, 'Renamed remotely');
    assert.deepEqual(body.project.assets.map(asset => asset.id), ['old', 'remote-audio', 'new-image']);
    return { ok: true, status: 200, json: async () => ({ success: true, updatedAt: '2026-08-31T12:01:00Z', revision: '2026-08-31T12:01:00Z' }) };
  } });

  assert.equal(await h.adapter(generated, { uid: 'alice', baseline, selectedId: 'p' }), false);
  assert.equal(h.state.selected.assets.some(asset => asset.id === 'new-image'), true);
  assert.equal(h.pendingConflicts.get('alice:p').baseline.assets.some(asset => asset.id === 'new-image'), false);

  // This is the real retry shape: the parent callback now captures the
  // optimistically selected project, including its not-yet-saved image.
  const optimisticSelection = h.state.selected;
  assert.equal(await h.adapter(optimisticSelection, { uid: 'alice', baseline: optimisticSelection, selectedId: 'p' }), false);
  assert.equal(h.state.selected.assets.some(asset => asset.id === 'new-image'), true);
  assert.match(h.state.errors.at(-1), /Click Save Project again/);
  const reviewedSelection = h.state.selected;
  assert.equal(await h.adapter(reviewedSelection, { uid: 'alice', baseline: reviewedSelection, selectedId: 'p' }), true);
  assert.equal(h.state.projects[0].assets.some(asset => asset.id === 'new-image'), true);
  assert.equal(h.pendingConflicts.has('alice:p'), false);
});
