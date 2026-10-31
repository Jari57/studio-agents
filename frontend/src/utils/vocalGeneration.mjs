// One contract for agent, orchestrator, and canvas vocal creation.
export const VOCAL_GENERATION_ENDPOINT = '/api/generate-speech';
// Music creation (300s), stem extraction (180s), then durable media storage.
export const VOCAL_REQUEST_TIMEOUT_MS = 600000;

export function vocalGenerationRequest(options = {}) {
  const request = { ...options };
  const selectedStyle = options.style || options.voiceStyle || 'rapper';
  request.style = ({ 'rapper-melodic': 'rapper', 'rapper-young': 'rapper',
    'rapper-female-melodic': 'rapper-female', 'singer-pop': 'singer',
    'singer-female-pop': 'singer-female' })[selectedStyle] || selectedStyle;
  request.rapStyle = selectedStyle.includes('melodic') ? 'melodic'
    : selectedStyle === 'rapper-young' ? 'trap' : options.rapStyle || 'melodic';
  request.genre = selectedStyle.includes('pop') ? 'pop' : options.genre || 'hip-hop';
  request.outputFormat = options.outputFormat || 'music';
  const musical = request.outputFormat === 'music' || /singer|rapper/.test(request.style) || !!options.backingTrackUrl;
  request.isPersonalVoice = options.isPersonalVoice === true || options.voiceSource === 'personal' || selectedStyle === 'cloned';
  request.prompt = String(request.isPersonalVoice && musical
    ? options.personalLyricsExcerpt || '' : options.prompt || '').trim();
  if (!request.prompt) throw new Error(request.isPersonalVoice && musical
    ? 'Open Voice & optional references and choose your approved singing reference and exact lyrics excerpt.'
    : 'Add lyrics before creating a vocal.');
  if (musical && request.prompt.length > (request.isPersonalVoice ? 400 : 3500)) {
    throw new Error(`Lyrics exceed the ${request.isPersonalVoice ? 400 : 3500}-character limit. Edit them before generating; nothing has been cut.`);
  }
  if (request.isPersonalVoice && musical && !options.personalReferenceId) {
    throw new Error('Open Voice & optional references and choose an approved personal singing reference. A speech clone cannot substitute for it.');
  }
  request.voice = options.voice || ({ 'rapper-female': 'rapper-female-1', singer: 'singer-male',
    'singer-female': 'singer-female' })[request.style] || (/rapper/.test(request.style) ? 'rapper-male-1' : request.style);
  request.language = options.language || 'English';
  request.duration = options.duration || 120;
  request.agentId = 'vocal-arch';
  request.speakerUrl = request.isPersonalVoice ? options.speakerUrl || null : null;
  request.elevenLabsVoiceId = musical ? null : options.elevenLabsVoiceId || null;
  request.personalReferenceId = request.isPersonalVoice && musical ? options.personalReferenceId : null;
  request.preferredProvider = musical ? (request.isPersonalVoice ? 'minimax-music' : null) : options.preferredProvider || null;
  delete request.personalLyricsExcerpt;
  delete request.voiceSource;
  delete request.voiceStyle;
  return request;
}

const playable = value => typeof value === 'string' && /^(https?:\/\/|blob:|data:audio\/)/.test(value);

export function normalizeVocalResult(data = {}) {
  const audioUrl = data.vocalUrl || data.audioUrl || data.output;
  if (!playable(audioUrl)) throw new Error('Vocal generation returned no playable vocal.');
  if (data.performanceType === 'spoken-vocal' && data.outputFormat === 'music') {
    throw new Error('The provider returned speech instead of a musical vocal.');
  }
  if (data.performanceType === 'coherent-song-stems' &&
      (!playable(data.instrumentalUrl) || !playable(data.mixedAudioUrl))) {
    throw new Error('The song is missing its matching accompaniment or master. No incomplete take was added.');
  }
  if (data.wasMixed && !data.mixedAudioUrl && !data.vocalUrl) {
    throw new Error('The provider returned a mix without a separate vocal stem. No mix was added as a vocal.');
  }
  return { ...data, audioUrl, instrumentalUrl: playable(data.instrumentalUrl) ? data.instrumentalUrl : null,
    mixedAudioUrl: playable(data.mixedAudioUrl) ? data.mixedAudioUrl : null };
}

export async function requestVocalGeneration(backendUrl, { request, headers, signal, fetchImpl = fetch, onResponse }) {
  const response = await fetchImpl(`${backendUrl}${VOCAL_GENERATION_ENDPOINT}`, {
    method: 'POST', headers, body: JSON.stringify(request),
    signal: signal || AbortSignal.timeout(VOCAL_REQUEST_TIMEOUT_MS),
  });
  onResponse?.(response);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.details || data.error || `Vocal generation failed (${response.status}).`);
  const result = normalizeVocalResult(data);
  if (request.outputFormat === 'music' && result.performanceType === 'spoken-vocal') {
    throw new Error('The provider returned speech instead of a musical vocal.');
  }
  return result;
}

export function vocalTakeAsset(data, { id, title = 'Vocal performance', content = '', settings = {}, createdAt = new Date().toISOString() }) {
  const result = normalizeVocalResult(data);
  return { id, title, type: 'vocal', agent: 'Vocal Architect', content,
    audioUrl: result.audioUrl, vocalUrl: result.audioUrl,
    instrumentalUrl: result.instrumentalUrl, mixedAudioUrl: result.mixedAudioUrl,
    provider: result.provider || result.source || null, mimeType: result.mimeType || 'audio/mpeg',
    storagePath: result.storagePath || result.audioStoragePath || null,
    instrumentalStoragePath: result.instrumentalStoragePath || null,
    songStoragePath: result.songStoragePath || null,
    metadata: { role: 'vocal', performanceId: result.performanceId || id },
    settings: { ...settings, ...(result.personalReferenceId ? { personalReferenceId: result.personalReferenceId } : {}) },
    createdAt, isDurable: result.isDurable !== false };
}

export function projectWithVocalTake(project, asset) {
  const vocal = { ...asset, audioUrl: asset.vocalUrl || asset.audioUrl,
    metadata: { ...asset.metadata, role: 'vocal' } };
  const performanceId = vocal.metadata.performanceId || vocal.id;
  const related = [vocal];
  if (vocal.instrumentalUrl) related.push({ id: `${vocal.id}-beat`, type: 'beat', title: 'Matching accompaniment',
    audioUrl: vocal.instrumentalUrl, storagePath: vocal.instrumentalStoragePath || null,
    metadata: { role: 'beat', performanceId }, createdAt: vocal.createdAt });
  if (vocal.mixedAudioUrl) related.push({ id: `${vocal.id}-master`, type: 'master', title: 'Original song master',
    audioUrl: vocal.mixedAudioUrl, storagePath: vocal.songStoragePath || null,
    metadata: { role: 'master', performanceId }, createdAt: vocal.createdAt });
  const oldMedia = project.mediaUrls || {};
  const settings = vocal.settings || {};
  const existingLyrics = project.outputs?.lyrics || (project.assets || []).find(item => item.type === 'lyrics')?.content;
  const lyrics = settings.isPersonalVoice && existingLyrics ? existingLyrics : vocal.content;
  const oldVocal = oldMedia.vocals || oldMedia.lyricsVocal;
  const mediaUrls = { ...oldMedia, vocals: vocal.audioUrl, lyricsVocal: vocal.audioUrl,
    mixedAudio: vocal.mixedAudioUrl || null,
    ...(vocal.instrumentalUrl ? { audio: vocal.instrumentalUrl } : {}) };
  const replaceLane = (tracks, previousUrl, url, role, assetId) => {
    if (!url) return tracks;
    let replaced = false;
    const next = tracks.map(track => {
      if ((previousUrl && track.url === previousUrl) || (!previousUrl && !replaced && track.role === role)) {
        replaced = true;
        return { ...track, url, assetId };
      }
      return track;
    });
    if (!replaced && !next.some(track => track.url === url)) next.push({
      id: `lane-${role}-${vocal.id}`, assetId, url, role, source: 'studio',
      name: role === 'vocal' ? 'Current vocal' : 'Current accompaniment',
      volume: role === 'vocal' ? 0.95 : 0.48, pan: 0, offset: 0,
      trimStart: 0, trimEnd: null, fadeIn: 0, fadeOut: 0, muted: false, solo: false,
    });
    return next;
  };
  const sessionTracks = Array.isArray(project.sessionState?.tracks)
    ? replaceLane(replaceLane(project.sessionState.tracks, oldVocal, vocal.audioUrl, 'vocal', vocal.id),
      oldMedia.audio, vocal.instrumentalUrl, 'beat', `${vocal.id}-beat`) : null;
  const sessionState = project.sessionState && { ...project.sessionState,
    ...(sessionTracks ? { tracks: sessionTracks } : {
      vocal: { ...project.sessionState.vocal, audioUrl: vocal.audioUrl },
      ...(vocal.instrumentalUrl ? { audio: { ...project.sessionState.audio, audioUrl: vocal.instrumentalUrl } } : {}),
    }) };
  const seen = new Set();
  const assets = [...related, ...(project.assets || [])].filter(item => {
    const key = item.audioUrl ? `${item.type}:${item.audioUrl}` : `id:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  return { ...project, assets, mediaUrls,
    outputs: { ...project.outputs, vocals: vocal.content || '', ...(lyrics ? { lyrics } : {}) },
    ...(sessionState ? { sessionState } : {}),
    songSession: { ...project.songSession,
      voiceSource: settings.isPersonalVoice ? 'personal' : 'studio',
      voiceStyle: settings.voiceStyle || settings.style || 'singer',
      ...Object.fromEntries(['genre', 'rapStyle', 'outputFormat', 'personalReferenceId', 'personalLyricsExcerpt']
        .filter(key => settings[key] != null).map(key => [key, settings[key]])),
      renderedMixSignature: vocal.mixedAudioUrl ? 'provider-original' : '',
      performance: vocal.instrumentalUrl && vocal.mixedAudioUrl ? { id: performanceId,
        vocalUrl: vocal.audioUrl, instrumentalUrl: vocal.instrumentalUrl, masterUrl: vocal.mixedAudioUrl } : null },
    updatedAt: new Date().toISOString() };
}
