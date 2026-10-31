import test from 'node:test';
import assert from 'node:assert/strict';
import { VOCAL_REQUEST_TIMEOUT_MS, vocalGenerationRequest, requestVocalGeneration, normalizeVocalResult, vocalTakeAsset, projectWithVocalTake } from '../src/utils/vocalGeneration.mjs';
import { restoreProjectOutputs } from '../src/utils/projectRestore.mjs';
import { initialProducerSession, producerAudioLibrary } from '../src/utils/producerSession.mjs';

const result = { audioUrl: 'https://example.test/vocal.mp3', instrumentalUrl: 'https://example.test/beat.mp3',
  mixedAudioUrl: 'https://example.test/master.mp3', performanceId: 'performance',
  performanceType: 'coherent-song-stems', wasMixed: true, provider: 'minimax-music-2.6-demucs' };

test('all vocal entry points preserve the full lyric, language, style and duration', () => {
  const lyrics = `Opening stanza\n${'Sing this line\n'.repeat(180)}[Chorus]\nKeep the opening too`;
  assert.ok(lyrics.length > 1500 && lyrics.length < 3500);
  const payload = vocalGenerationRequest({ prompt: lyrics, style: 'singer-female-pop', language: 'Spanish', duration: 145 });
  assert.equal(payload.prompt, lyrics);
  assert.equal(payload.style, 'singer-female');
  assert.equal(payload.genre, 'pop');
  assert.equal(payload.language, 'Spanish');
  assert.equal(payload.duration, 145);
  assert.throws(() => vocalGenerationRequest({ prompt: 'a'.repeat(3501) }), /nothing has been cut/);
});

test('personal identity requires its approved reference and explicit excerpt', () => {
  assert.throws(() => vocalGenerationRequest({ prompt: 'Full song', style: 'cloned', elevenLabsVoiceId: 'speech-clone' }), /approved singing reference/);
  const payload = vocalGenerationRequest({ style: 'cloned', personalLyricsExcerpt: 'These exact words',
    personalReferenceId: 'approved', speakerUrl: 'https://example.test/owned.wav', elevenLabsVoiceId: 'speech-clone' });
  assert.equal(payload.prompt, 'These exact words');
  assert.equal(payload.personalReferenceId, 'approved');
  assert.equal(payload.elevenLabsVoiceId, null);
  const studio = vocalGenerationRequest({ prompt: 'Studio lyric', voiceSource: 'studio', speakerUrl: 'https://example.test/private.wav', elevenLabsVoiceId: 'old-clone' });
  assert.equal(studio.speakerUrl, null);
  assert.equal(studio.isPersonalVoice, false);
  const narration = vocalGenerationRequest({ prompt: 'Read these exact words', style: 'cloned',
    outputFormat: 'podcast', elevenLabsVoiceId: 'owned-speech-identity' });
  assert.equal(narration.elevenLabsVoiceId, 'owned-speech-identity');
  assert.equal(narration.personalReferenceId, null);
});

test('a full mix or incomplete song cannot masquerade as an isolated vocal', () => {
  assert.throws(() => normalizeVocalResult({ audioUrl: result.mixedAudioUrl, wasMixed: true }), /separate vocal stem/);
  assert.throws(() => normalizeVocalResult({ ...result, instrumentalUrl: null }), /missing its matching/);
  assert.equal(normalizeVocalResult({ ...result, vocalUrl: result.audioUrl, audioUrl: result.mixedAudioUrl }).audioUrl, result.audioUrl);
});

test('save and reopen keep only dry vocals and matched accompaniment in mixer lanes', () => {
  const asset = vocalTakeAsset(result, { id: 'take', content: 'Original lyric', settings: { language: 'Spanish' } });
  const project = projectWithVocalTake({ id: 'project', assets: [] }, asset);
  assert.deepEqual(project.assets.map(a => a.type), ['vocal', 'beat', 'master']);
  assert.equal(project.assets[0].audioUrl, result.audioUrl);
  const reopened = JSON.parse(JSON.stringify(project));
  assert.equal(restoreProjectOutputs(reopened).media.mixedAudio, result.mixedAudioUrl);
  const session = initialProducerSession(reopened);
  assert.deepEqual(session.tracks.map(t => t.url), [result.instrumentalUrl, result.audioUrl]);
  assert.ok(!session.tracks.some(t => t.url === result.mixedAudioUrl));
  assert.equal(projectWithVocalTake(project, asset).assets.length, 3);
});

test('replacing a vocal clears its stale master and updates saved mixer lanes without deleting history', () => {
  const project = { id: 'project', assets: [{ id: 'old-master', type: 'master', audioUrl: 'https://example.test/old-master' }],
    mediaUrls: { vocals: 'https://example.test/old-vocal', audio: 'https://example.test/old-beat', mixedAudio: 'https://example.test/old-master' },
    sessionState: { tracks: [{ id: 'v', role: 'vocal', url: 'https://example.test/old-vocal', volume: 0.8 }, { id: 'b', role: 'beat', url: 'https://example.test/old-beat' }] } };
  const asset = vocalTakeAsset({ audioUrl: result.audioUrl }, { id: 'new' });
  const updated = projectWithVocalTake(project, asset);
  assert.equal(updated.mediaUrls.mixedAudio, null);
  assert.equal(restoreProjectOutputs(updated).media.mixedAudio, null);
  assert.equal(updated.sessionState.tracks[0].url, result.audioUrl);
  assert.equal(updated.sessionState.tracks[0].volume, 0.8);
  assert.equal(updated.assets.at(-1).id, 'old-master');
  assert.equal(project.sessionState.tracks[0].url, 'https://example.test/old-vocal');
});

test('legacy mixed previews recover the dry stem in playback and mixer libraries', () => {
  const project = { mediaUrls: { vocals: result.mixedAudioUrl, lyricsVocal: result.mixedAudioUrl },
    sessionState: { tracks: [{ role: 'vocal', url: result.mixedAudioUrl }] },
    assets: [{ id: 'legacy', type: 'vocal', audioUrl: result.mixedAudioUrl, vocalUrl: result.audioUrl,
    instrumentalUrl: result.instrumentalUrl, mixedAudioUrl: result.mixedAudioUrl }] };
  assert.equal(restoreProjectOutputs(project).media.vocals, result.audioUrl);
  assert.equal(restoreProjectOutputs(project).media.audio, result.instrumentalUrl);
  assert.equal(producerAudioLibrary(project)[0].audioUrl, result.audioUrl);
  assert.equal(initialProducerSession(project).tracks[0].url, result.audioUrl);
});

test('one vocal request allows both provider stages and personal auditions preserve full project lyrics', () => {
  assert.ok(VOCAL_REQUEST_TIMEOUT_MS > 300000 + 180000);
  const asset = vocalTakeAsset(result, { id: 'personal-take', content: 'Only this excerpt',
    settings: { isPersonalVoice: true, style: 'cloned', personalReferenceId: 'approved' } });
  const project = projectWithVocalTake({ outputs: { lyrics: 'Full original song' } }, asset);
  assert.equal(project.outputs.lyrics, 'Full original song');
  assert.equal(project.songSession.voiceSource, 'personal');
});

test('adding vocals to a beat-only saved session creates the missing vocal lane and replaces the accompaniment', () => {
  const asset = vocalTakeAsset(result, { id: 'first-vocal', content: 'Lyrics' });
  const project = projectWithVocalTake({ sessionState: { tracks: [{ id: 'beat', role: 'beat', url: 'https://example.test/old-beat' }] } }, asset);
  assert.equal(project.sessionState.tracks.length, 2);
  assert.equal(project.sessionState.tracks.find(track => track.role === 'beat').url, result.instrumentalUrl);
  assert.equal(project.sessionState.tracks.find(track => track.role === 'vocal').url, result.audioUrl);
});

test('shared transport makes one request and reports the provider failure without retrying another engine', async () => {
  let calls = 0;
  const request = vocalGenerationRequest({ prompt: 'Sing these words' });
  await assert.rejects(requestVocalGeneration('https://example.test', { request, headers: {}, fetchImpl: async () => {
    calls++; return { ok: false, status: 503, json: async () => ({ details: 'Stem separation failed' }) };
  } }), /Stem separation failed/);
  assert.equal(calls, 1);
  await assert.rejects(requestVocalGeneration('https://example.test', { request, headers: {}, fetchImpl: async () => ({
    ok: true, json: async () => ({ audioUrl: result.audioUrl, performanceType: 'spoken-vocal' }),
  }) }), /speech instead/);
});
