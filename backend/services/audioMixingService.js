/**
 * Professional Audio Mixing & Mastering Service
 * Mixes vocals + beats with Billboard-level quality
 * Features: Auto-ducking, compression, EQ, loudness normalization (LUFS)
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const dns = require('dns').promises;
const net = require('net');

// Wire the bundled ffmpeg binary so it works on Railway/Heroku/etc.
ffmpeg.setFfmpegPath(ffmpegStatic);

// fluent-ffmpeg only reports the last stderr line ("Conversion failed!").
// Keep the tail of ffmpeg's own diagnostics, minus local file paths, so a
// failed mix can tell the user (and the logs) what actually went wrong.
function describeFfmpegFailure(err, stderr) {
  const tail = String(stderr || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !/^(frame=|size=|Conversion failed!$)/.test(line))
    .slice(-3)
    .join(' | ')
    .replace(/[A-Za-z]:\\[^\s'"|]+|\/[^\s'"|]+/g, '<file>');
  const base = err?.message || 'ffmpeg failed';
  const message = tail && !base.includes(tail) ? `${base} — ${tail}` : base;
  const wrapped = new Error(message.slice(0, 500));
  wrapped.code = 'MIX_RENDER_FAILED';
  wrapped.publicReason = message.slice(0, 300);
  return wrapped;
}

/**
 * Download audio/video file from URL with redirect following and timeout
 */
const MAX_AUDIO_DOWNLOAD_BYTES = 150 * 1024 * 1024;

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const parts = address.split('.').map(Number);
    return parts[0] === 10
      || parts[0] === 127
      || parts[0] === 0
      || (parts[0] === 169 && parts[1] === 254)
      || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      || (parts[0] === 192 && parts[1] === 168);
  }
  const normalized = address.toLowerCase();
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fc')
    || normalized.startsWith('fd') || normalized.startsWith('fe80:');
}

async function assertSafeRemoteAudioUrl(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error('Remote audio sources must use HTTPS');
  if (parsed.username || parsed.password) throw new Error('Credentialed audio URLs are not accepted');
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local')) throw new Error('Local audio URLs are not accepted');
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error('Private-network audio URLs are not accepted');
    return;
  }
  const addresses = await dns.lookup(hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Audio URL resolved to an unsafe network address');
  }
}

async function downloadAudio(url, destPath, maxRedirects = 3) {
  if (typeof url !== 'string') throw new Error('Audio URL must be a string');
  if (!url.startsWith('data:')) await assertSafeRemoteAudioUrl(url);
  return new Promise((resolve, reject) => {
    // Handle base64 data URLs (vocals/beats returned as data: URIs from AI providers)
    if (url.startsWith('data:')) {
      try {
        const match = url.match(/^data:[^;]+;base64,(.+)$/s);
        if (!match) return reject(new Error('Invalid data URI — missing base64 payload'));
        fs.writeFileSync(destPath, Buffer.from(match[1], 'base64'));
        return resolve(destPath);
      } catch (err) {
        return reject(err);
      }
    }

    const doRequest = (requestUrl, redirectsLeft) => {
      const protocol = requestUrl.startsWith('https') ? https : http;
      const file = fs.createWriteStream(destPath);

      const req = protocol.get(requestUrl, (response) => {
        // Follow redirects (301, 302, 307, 308)
        if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
          file.close();
          fs.unlink(destPath, () => {});
          if (redirectsLeft <= 0) {
            return reject(new Error(`Too many redirects downloading ${requestUrl}`));
          }
          const redirectUrl = response.headers.location.startsWith('http')
            ? response.headers.location
            : new URL(response.headers.location, requestUrl).href;
          assertSafeRemoteAudioUrl(redirectUrl)
            .then(() => doRequest(redirectUrl, redirectsLeft - 1))
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          reject(new Error(`Download failed: HTTP ${response.statusCode} for ${requestUrl.substring(0, 80)}`));
          return;
        }
        const declaredSize = Number(response.headers['content-length'] || 0);
        if (declaredSize > MAX_AUDIO_DOWNLOAD_BYTES) {
          response.destroy();
          file.close();
          fs.unlink(destPath, () => {});
          reject(new Error('Audio source is larger than the 150MB session limit'));
          return;
        }
        let received = 0;
        response.on('data', (chunk) => {
          received += chunk.length;
          if (received > MAX_AUDIO_DOWNLOAD_BYTES) {
            response.destroy(new Error('Audio source exceeded the 150MB session limit'));
          }
        });
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(destPath);
        });
      });

      // 60-second timeout to prevent hanging on stalled connections
      req.setTimeout(60000, () => {
        req.destroy();
        file.close();
        fs.unlink(destPath, () => {});
        reject(new Error(`Download timed out after 60s: ${requestUrl.substring(0, 80)}`));
      });

      req.on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };

    doRequest(url, maxRedirects);
  });
}

/**
 * Professional Audio Mixing
 * Combines vocals + beat with studio-quality processing
 *
 * @param {Object} options - Mixing parameters
 * @param {string} options.vocalPath - Path to vocal audio file
 * @param {string} options.beatPath - Path to beat audio file
 * @param {string} options.outputPath - Output file path
 * @param {number} options.vocalVolume - Vocal volume (0-1, default 0.85)
 * @param {number} options.beatVolume - Beat volume (0-1, default 0.60)
 * @param {boolean} options.autoDuck - Auto-duck beat when vocals play (default true)
 * @param {boolean} options.compression - Apply professional compression (default true)
 * @param {number} options.lufsTarget - Target loudness in LUFS (default -14)
 * @param {string} options.outputFormat - Output format preset: 'music', 'social', 'podcast', 'tv'
 * @param {Object} logger - Logger instance
 */
async function mixAudioProfessional(options, logger) {
  const {
    vocalPath,
    beatPath,
    outputPath,
    vocalVolume = 0.85,
    beatVolume = 0.60,
    autoDuck = true,
    compression = true,
    lufsTarget = -14,
    outputFormat = 'music'
  } = options;

  return new Promise((resolve, reject) => {
    try {
      if (!vocalPath || !beatPath) {
        reject(new Error('Both vocalPath and beatPath are required'));
        return;
      }

      if (logger) logger.info('Starting professional audio mixing', {
        vocalVolume,
        beatVolume,
        autoDuck,
        compression,
        lufsTarget,
        outputFormat
      });

      // Build complex filter graph for professional mixing
      const filterComplex = [];

      // === TRACK PROCESSING ===

      // Vocal processing. Keep this deliberately corrective: generated audio
      // already contains processing, so exciters, widening and synthetic echo
      // compound artifacts instead of making it sound more professional.
      // HPF removes mic rumble + room noise below 80Hz
      let vocalFilters = `[0:a]highpass=f=85,volume=${vocalVolume}`;

      vocalFilters += `,equalizer=f=220:width_type=o:width=1.2:g=-2.0`;
      vocalFilters += `,equalizer=f=3000:width_type=o:width=1.5:g=1.5`;
      vocalFilters += `,equalizer=f=7500:width_type=o:width=0.8:g=-2.5`;
      vocalFilters += `,acompressor=threshold=-20dB:ratio=2.5:attack=12:release=120:makeup=1.5`;

      vocalFilters += `[vocal]`;
      filterComplex.push(vocalFilters);

      // Beat processing
      let beatFilters = `[1:a]volume=${beatVolume}`;

      // Small corrective moves only; large boosts expose generator noise and
      // can turn sustained artifacts into the high-pitched beeps users heard.
      beatFilters += `,highpass=f=28`;
      beatFilters += `,equalizer=f=280:width_type=o:width=1.2:g=-1.0`;
      beatFilters += `,equalizer=f=3200:width_type=o:width=1.2:g=-1.5`;

      beatFilters += `[beat]`;
      filterComplex.push(beatFilters);

      // === AUTO-DUCKING (Lyria-grade sidechaining) ===
      // When vocals play, slightly reduce beat volume for clarity
      if (autoDuck) {
        // A filter output may only feed ONE input. ffmpeg 7+ (Railway/Alpine)
        // rejects reusing [vocal] for both the sidechain key and the mix
        // ("Stream specifier 'vocal' in filtergraph description ... Invalid
        // argument"), so fork it explicitly.
        filterComplex.push(`[vocal]asplit=2[vocal_key][vocal_mix]`);
        // threshold 0.05 = lower threshold for more responsive ducking
        // ratio 4.0 = firmer pocket for vocals (Billboard Standard)
        // attack 5ms = faster ducking to avoid initial clashing
        filterComplex.push(`[beat][vocal_key]sidechaincompress=threshold=0.08:ratio=2.5:attack=10:release=220:makeup=1[beat_ducked]`);
        filterComplex.push(`[vocal_mix][beat_ducked]amix=inputs=2:duration=longest:normalize=0[mixed]`);
      } else {
        // Simple mix without ducking — normalize=0 preserves volume
        filterComplex.push(`[vocal][beat]amix=inputs=2:duration=longest:normalize=0[mixed]`);
      }

      // === COMPRESSION & MASTERING CHAIN ===
      // Professional mastering-grade compression — firmer ratio for "radio" sound
      if (compression) {
        filterComplex.push(`[mixed]acompressor=threshold=-16dB:ratio=2:attack=15:release=150:makeup=1dB[compressed]`);
        filterComplex.push(`[compressed]alimiter=limit=0.94:attack=5:release=80[limited]`);
      }

      // === LOUDNESS NORMALIZATION ===
      // Honor the caller's target. -14 LUFS preserves headroom and avoids the
      // clipping/distortion caused by forcing every generated mix to -9 LUFS.
      const finalOutput = compression ? '[limited]' : '[mixed]';
      const safeLufsTarget = Math.max(-24, Math.min(-10, Number(lufsTarget) || -14));
      filterComplex.push(`${finalOutput}loudnorm=I=${safeLufsTarget}:TP=-1.5:LRA=9[normalized]`);

      // === OUTPUT FORMAT SPECIFIC PROCESSING ===
      let finalFilters = '[normalized]';

      if (outputFormat === 'social') {
        // Extra bass punch and brightness for phone speakers
        filterComplex.push(`${finalFilters}equalizer=f=100:width_type=o:width=1:g=4,equalizer=f=4000:width_type=o:width=2:g=2[social]`);
        finalFilters = '[social]';
      } else if (outputFormat === 'podcast') {
        // Warm, voice-focused mix
        filterComplex.push(`${finalFilters}equalizer=f=150:width_type=o:width=1:g=2,highpass=f=80[podcast]`);
        finalFilters = '[podcast]';
      } else if (outputFormat === 'tv') {
        // Broadcast-safe loudness and dynamics
        filterComplex.push(`${finalFilters}alimiter=limit=0.90:attack=5:release=50[tv]`);
        finalFilters = '[tv]';
      }

      // Join all filters
      const filterComplexString = filterComplex.join(';');

      if (logger) logger.info('Filter chain built', {
        filters: filterComplex.length,
        autoDuck,
        compression
      });

      // Build FFmpeg command
      const cmd = ffmpeg()
        .input(vocalPath)
        .input(beatPath)
        .complexFilter(filterComplexString, finalFilters)
        .audioCodec('libmp3lame')
        .audioBitrate('320k') // High-quality MP3
        .audioChannels(2) // Stereo
        .audioFrequency(44100) // CD quality
        .output(outputPath)
        .on('start', (cmdLine) => {
          if (logger) logger.info('FFmpeg mixing started', { command: cmdLine.substring(0, 200) + '...' });
        })
        .on('progress', (progress) => {
          if (logger) logger.debug('Mixing progress', {
            time: progress.timemark
          });
        })
        .on('end', () => {
          if (logger) logger.info('Professional mix complete', {
            output: outputPath,
            format: outputFormat,
            lufs: lufsTarget
          });

          resolve({
            success: true,
            outputPath,
            format: outputFormat,
            quality: 'automated-preview-mix',
            processing: {
              vocalVolume,
              beatVolume,
              autoDuck,
              compression,
              lufsTarget
            }
          });
        })
        .on('error', (err, _stdout, stderr) => {
          const failure = describeFfmpegFailure(err, stderr);
          if (logger) logger.error('Mixing error', { error: failure.message });

          // Cleanup on error
          try {
            if (fs.existsSync(outputPath)) {
              fs.unlinkSync(outputPath);
            }
          } catch (_e) { /* ignore */ }

          reject(failure);
        });

      cmd.run();

    } catch (error) {
      if (logger) logger.error('Mix setup error', { error: error.message });
      reject(error);
    }
  });
}

/**
 * Download and mix audio from URLs
 * High-level convenience function for API endpoints
 */
async function mixAudioFromUrls(vocalUrl, beatUrl, options, logger) {
  const tempDir = path.join(__dirname, '../../backend', 'temp');

  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const timestamp = Date.now();
  const vocalPath = path.join(tempDir, `vocal_${timestamp}.mp3`);
  const beatPath = path.join(tempDir, `beat_${timestamp}.mp3`);
  const outputPath = options.outputPath || path.join(tempDir, `mixed_${timestamp}.mp3`);

  try {
    if (logger) logger.info('Downloading audio files for mixing', {
      vocalUrl: vocalUrl.substring(0, 50),
      beatUrl: beatUrl.substring(0, 50)
    });

    // Download both files in parallel
    try {
      await Promise.all([
        downloadAudio(vocalUrl, vocalPath),
        downloadAudio(beatUrl, beatPath)
      ]);
    } catch (downloadError) {
      const failure = new Error(`Could not download audio for mixing: ${downloadError.message}`);
      failure.code = 'MIX_AUDIO_DOWNLOAD_FAILED';
      failure.publicReason = failure.message.slice(0, 300);
      throw failure;
    }

    if (logger) logger.info('Audio files downloaded, starting mix...');

    // Mix the audio
    const result = await mixAudioProfessional({
      ...options,
      vocalPath,
      beatPath,
      outputPath
    }, logger);

    // Cleanup temp files (keep output)
    try {
      fs.unlinkSync(vocalPath);
      fs.unlinkSync(beatPath);
    } catch (_e) { /* ignore cleanup errors */ }

    return result;

  } catch (error) {
    // Cleanup on error
    [vocalPath, beatPath, outputPath].forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (_e) { /* ignore */ }
    });

    throw error;
  }
}

const PRODUCER_TRACK_ROLES = new Set(['beat', 'instrument', 'vocal', 'harmony', 'adlib', 'fx']);

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

/**
 * Normalize producer-canvas tracks at the backend trust boundary. The client
 * can request creative settings, but it cannot inject arbitrary FFmpeg syntax.
 */
function normalizeProducerTracks(tracks) {
  if (!Array.isArray(tracks)) return [];
  return tracks
    .filter((track) => track && typeof track.url === 'string' && track.url.length > 0 && !track.muted)
    .slice(0, 12)
    .map((track, index) => ({
      id: String(track.id || `track-${index + 1}`).slice(0, 120),
      name: String(track.name || `Track ${index + 1}`).slice(0, 160),
      url: track.url,
      role: PRODUCER_TRACK_ROLES.has(track.role) ? track.role : 'instrument',
      volume: clampNumber(track.volume, 0, 1.5, 0.8),
      pan: clampNumber(track.pan, -1, 1, 0),
      offset: clampNumber(track.offset, 0, 120, 0),
      trimStart: clampNumber(track.trimStart, 0, 3600, 0),
      trimEnd: track.trimEnd == null || track.trimEnd === ''
        ? null
        : clampNumber(track.trimEnd, 0, 3600, null),
      fadeIn: clampNumber(track.fadeIn, 0, 30, 0),
      fadeOut: clampNumber(track.fadeOut, 0, 30, 0),
      solo: Boolean(track.solo),
    }));
}

/**
 * Builds a deterministic, escaped-by-construction FFmpeg graph. Exported for
 * tests because this is the heart of the producer mix and must stay auditable.
 */
function selectProducerTracks(rawTracks) {
  if (Array.isArray(rawTracks) && rawTracks.filter(track => track?.url && !track.muted).length > 12) {
    throw new Error('A producer mix supports at most 12 audible tracks');
  }
  let tracks = normalizeProducerTracks(rawTracks);
  const soloTracks = tracks.filter((track) => track.solo);
  if (soloTracks.length > 0) tracks = soloTracks;
  if (tracks.length === 0) throw new Error('At least one audible track is required');
  for (const track of tracks) {
    if (track.trimEnd !== null && track.trimEnd <= track.trimStart) {
      throw new Error(`Trim out must be later than trim in for ${track.name}`);
    }
  }
  return tracks;
}

function buildMultiStemFilterGraph(rawTracks, options = {}) {
  const tracks = selectProducerTracks(rawTracks);

  const filters = [];
  const vocalLabels = [];
  const musicLabels = [];

  tracks.forEach((track, index) => {
    const label = `track_${index}`;
    const chain = [
      `atrim=start=${track.trimStart}${track.trimEnd ? `:end=${track.trimEnd}` : ''}`,
      'asetpts=PTS-STARTPTS',
      'aresample=44100',
      'aformat=sample_fmts=fltp:channel_layouts=stereo',
      `volume=${track.volume}`,
    ];
    if (track.pan !== 0) chain.push(`stereotools=balance_out=${track.pan}`);
    if (track.fadeIn > 0) chain.push(`afade=t=in:st=0:d=${track.fadeIn}`);
    if (track.fadeOut > 0) {
      const sourceDuration = options.sourceDurations?.[index];
      const end = Math.min(track.trimEnd || Infinity, sourceDuration || Infinity);
      if (!Number.isFinite(end) || (!sourceDuration && !track.trimEnd)) {
        throw new Error('Audio duration is required to render a full-track fade-out');
      }
      const length = Math.max(0.05, end - track.trimStart);
      const fade = Math.min(track.fadeOut, length);
      chain.push(`afade=t=out:st=${length - fade}:d=${fade}`);
    }
    if (track.offset > 0) chain.push(`adelay=${Math.round(track.offset * 1000)}:all=1`);
    filters.push(`[${index}:a]${chain.join(',')}[${label}]`);
    (['vocal', 'harmony', 'adlib'].includes(track.role) ? vocalLabels : musicLabels).push(`[${label}]`);
  });

  const mixBus = (labels, name) => {
    if (labels.length === 1) {
      filters.push(`${labels[0]}anull[${name}]`);
    } else if (labels.length > 1) {
      filters.push(`${labels.join('')}amix=inputs=${labels.length}:duration=longest:dropout_transition=2:normalize=0[${name}]`);
    }
  };

  mixBus(musicLabels, 'music_bus');
  mixBus(vocalLabels, 'vocal_bus');

  if (musicLabels.length && vocalLabels.length) {
    if (options.autoDuck !== false) {
      filters.push('[vocal_bus]asplit=2[vocal_sidechain][vocal_mix]');
      // Silence-pad only the detector, not the audible vocal bus. Otherwise
      // sidechaincompress stops the instrumental when a shorter vocal ends.
      // The finite music bus bounds this padded detector's lifetime.
      filters.push('[vocal_sidechain]apad[vocal_detector]');
      filters.push('[music_bus][vocal_detector]sidechaincompress=threshold=0.08:ratio=2.5:attack=10:release=220[ducked_music]');
      filters.push('[ducked_music][vocal_mix]amix=inputs=2:duration=longest:dropout_transition=2:normalize=0[session_mix]');
    } else {
      filters.push('[music_bus][vocal_bus]amix=inputs=2:duration=longest:dropout_transition=2:normalize=0[session_mix]');
    }
  } else {
    filters.push(`${musicLabels.length ? '[music_bus]' : '[vocal_bus]'}anull[session_mix]`);
  }

  const targetLufs = clampNumber(options.lufsTarget, -24, -10, -14);
  filters.push(`[session_mix]acompressor=threshold=-16dB:ratio=2:attack=15:release=150:makeup=1dB,alimiter=limit=0.94:attack=5:release=80,loudnorm=I=${targetLufs}:TP=-1.5:LRA=9[producer_master]`);

  return { tracks, filterComplex: filters.join(';'), outputLabel: 'producer_master' };
}

async function mixMultipleStems(rawTracks, options = {}, logger) {
  const tracks = selectProducerTracks(rawTracks);
  const tempDir = path.join(__dirname, '../../backend', 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const inputPaths = tracks.map((_, index) => path.join(tempDir, `producer_${stamp}_${index}.audio`));
  const outputPath = options.outputPath || path.join(tempDir, `producer_master_${stamp}.mp3`);

  try {
    await Promise.all(tracks.map((track, index) => downloadAudio(track.url, inputPaths[index])));
    const sourceDurations = await Promise.all(tracks.map((track, index) => track.fadeOut > 0 ? readProducerDuration(inputPaths[index]) : null));
    const { filterComplex, outputLabel } = buildMultiStemFilterGraph(tracks, { ...options, sourceDurations });
    await new Promise((resolve, reject) => {
      let command = ffmpeg();
      const timeout = setTimeout(() => { command.kill('SIGKILL'); reject(new Error('Producer render exceeded its three-minute processing budget')); }, 180000);
      inputPaths.forEach((inputPath) => { command = command.input(inputPath); });
      command
        .complexFilter(filterComplex, outputLabel)
        .audioCodec('libmp3lame')
        .audioBitrate('320k')
        .audioChannels(2)
        .audioFrequency(44100)
        .output(outputPath)
        .on('start', () => logger?.info('Producer canvas render started', { trackCount: tracks.length }))
        .on('end', () => { clearTimeout(timeout); resolve(); })
        .on('error', (error, _stdout, stderr) => {
          clearTimeout(timeout);
          logger?.error('Producer canvas FFmpeg render failed', {
            error: error.message,
            stderr: String(stderr || '').slice(-4000),
          });
          reject(error);
        })
        .run();
    });
    return {
      success: true,
      outputPath,
      quality: 'producer-preview-master',
      processing: {
        trackCount: tracks.length,
        autoDuck: options.autoDuck !== false,
        lufsTarget: clampNumber(options.lufsTarget, -24, -10, -14),
      },
      tracks,
    };
  } catch (error) {
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch { /* best-effort temp cleanup */ }
    throw error;
  } finally {
    inputPaths.forEach((inputPath) => {
      try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch { /* best-effort temp cleanup */ }
    });
  }
}

// Read container metadata without reversing/buffering an entire audio file.
// Only fade-out tracks need this; unknown duration fails rather than silently
// dropping an artist's requested fade.
function readProducerDuration(inputPath) {
  const { execFile } = require('child_process');
  return new Promise((resolve, reject) => {
    execFile(ffmpegStatic, ['-hide_banner', '-i', inputPath, '-t', '0', '-f', 'null', '-'],
      { timeout: 15000, maxBuffer: 1024 * 1024, windowsHide: true }, (error, _stdout, stderr) => {
        const match = String(stderr || '').match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
        const duration = match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : 0;
        if (error || !Number.isFinite(duration) || duration <= 0) reject(new Error('Could not determine audio duration for fade-out'));
        else resolve(duration);
      });
  });
}

/**
 * Quick mix preset for common use cases
 */
function getMixPreset(presetName) {
  const presets = {
    'rapper-over-beat': {
      vocalVolume: 0.90,
      beatVolume: 0.55,
      autoDuck: true,
      compression: true,
      lufsTarget: -14,
      outputFormat: 'music'
    },
    'singer-over-beat': {
      vocalVolume: 0.80,
      beatVolume: 0.65,
      autoDuck: true,
      compression: true,
      lufsTarget: -14,
      outputFormat: 'music'
    },
    'podcast-intro': {
      vocalVolume: 0.85,
      beatVolume: 0.40,
      autoDuck: true,
      compression: true,
      lufsTarget: -16,
      outputFormat: 'podcast'
    },
    'social-viral': {
      vocalVolume: 0.90,
      beatVolume: 0.60,
      autoDuck: true,
      compression: true,
      lufsTarget: -11, // Louder for social
      outputFormat: 'social'
    },
    'tv-commercial': {
      vocalVolume: 0.85,
      beatVolume: 0.50,
      autoDuck: true,
      compression: true,
      lufsTarget: -23, // Broadcast standard
      outputFormat: 'tv'
    }
  };

  return presets[presetName] || presets['rapper-over-beat'];
}

/**
 * Detect BPM of an audio file using FFmpeg energy onset analysis.
 * Returns estimated BPM or null if detection fails.
 */
function detectBpmFromFile(audioPath, logger) {
  return new Promise((resolve) => {
    try {
      const { execFile } = require('child_process');

      // Get audio duration using ffmpeg-static (no ffprobe needed)
      execFile(ffmpegStatic, [
        '-i', audioPath,
        '-af', 'astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-',
        '-f', 'null', '-'
      ], { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }, (error, _stdout, stderr) => {
        // FFmpeg prints duration info to stderr even on success
        const durationMatch = (stderr || '').match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
        if (!durationMatch) {
          if (logger) logger.warn('BPM detection: could not determine duration');
          resolve(null);
          return;
        }

        const duration = parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]);
        if (duration < 2) { resolve(null); return; }

        // Use a separate call with volumedetect + astats to find onset peaks
        const analysisPath = audioPath + '.energy.txt';
        execFile(ffmpegStatic, [
          '-i', audioPath,
          '-af', `astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=${analysisPath}`,
          '-f', 'null', '-'
        ], { timeout: 30000 }, (error2) => {
          if (error2 || !fs.existsSync(analysisPath)) {
            if (logger) logger.warn('BPM detection: energy analysis failed', { error: error2?.message });
            resolve(null);
            return;
          }

          try {
            const lines = fs.readFileSync(analysisPath, 'utf8').split('\n');
            const energyValues = [];
            let currentTime = null;

            for (const line of lines) {
              const timeMatch = line.match(/pts_time:([\d.]+)/);
              if (timeMatch) currentTime = parseFloat(timeMatch[1]);
              const rmsMatch = line.match(/RMS_level=(-?[\d.]+)/);
              if (rmsMatch && currentTime !== null) {
                energyValues.push({ time: currentTime, rms: parseFloat(rmsMatch[1]) });
              }
            }

            fs.unlinkSync(analysisPath);

            if (energyValues.length < 10) {
              resolve(null);
              return;
            }

            // Find peaks (onsets) in energy
            const threshold = energyValues.reduce((s, v) => s + v.rms, 0) / energyValues.length + 3;
            const peaks = [];
            for (let i = 1; i < energyValues.length - 1; i++) {
              if (energyValues[i].rms > energyValues[i - 1].rms &&
                  energyValues[i].rms > energyValues[i + 1].rms &&
                  energyValues[i].rms > threshold) {
                // Debounce: skip peaks too close to previous (< 200ms)
                if (peaks.length === 0 || energyValues[i].time - peaks[peaks.length - 1] > 0.2) {
                  peaks.push(energyValues[i].time);
                }
              }
            }

            if (peaks.length < 4) {
              resolve(null);
              return;
            }

            // Calculate inter-onset intervals and estimate BPM
            const intervals = [];
            for (let i = 1; i < peaks.length; i++) {
              intervals.push(peaks[i] - peaks[i - 1]);
            }

            // Cluster intervals to find dominant tempo
            const median = intervals.sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
            const bpm = Math.round(60 / median);

            // Clamp to musical range and resolve octave ambiguity
            let finalBpm = bpm;
            if (finalBpm < 60) finalBpm *= 2;
            if (finalBpm > 200) finalBpm = Math.round(finalBpm / 2);
            finalBpm = Math.max(60, Math.min(200, finalBpm));

            if (logger) logger.info('BPM detected from audio', { bpm: finalBpm, peaks: peaks.length, confidence: peaks.length > 10 ? 'high' : 'low' });
            resolve(finalBpm);
          } catch (_parseErr) {
            try { fs.unlinkSync(analysisPath); } catch { /* best-effort temp cleanup */ }
            resolve(null);
          }
        });
      });
    } catch (err) {
      if (logger) logger.warn('BPM detection error', { error: err.message });
      resolve(null);
    }
  });
}

/**
 * Time-stretch vocal audio to match beat BPM using FFmpeg atempo filter.
 * Preserves pitch while adjusting timing to lock vocals to the beat grid.
 *
 * @param {string} vocalPath - Path to vocal audio file
 * @param {number} vocalBpm - Detected vocal rhythm/speech rate as BPM
 * @param {number} targetBpm - Beat BPM to match
 * @param {string} outputPath - Output file path
 * @param {Object} logger - Logger instance
 * @returns {Promise<string>} Path to time-stretched audio
 */
function tempoStretchVocal(vocalPath, vocalBpm, targetBpm, outputPath, logger) {
  return new Promise((resolve, _reject) => {
    if (!vocalBpm || !targetBpm || vocalBpm === targetBpm) {
      resolve(vocalPath); // No stretch needed
      return;
    }

    const ratio = targetBpm / vocalBpm;

    // Only stretch if ratio is within a reasonable range (0.75x to 1.33x)
    // Beyond this, the audio would sound unnatural
    if (ratio < 0.75 || ratio > 1.33) {
      if (logger) logger.info('Tempo ratio too extreme, skipping stretch', { ratio: ratio.toFixed(3), vocalBpm, targetBpm });
      resolve(vocalPath);
      return;
    }

    if (logger) logger.info('Time-stretching vocal to match beat BPM', { vocalBpm, targetBpm, ratio: ratio.toFixed(3) });

    // FFmpeg atempo supports 0.5–2.0. For ratios outside, chain multiple filters.
    const filters = [];
    let remaining = ratio;
    while (remaining < 0.5 || remaining > 2.0) {
      if (remaining < 0.5) {
        filters.push('atempo=0.5');
        remaining /= 0.5;
      } else {
        filters.push('atempo=2.0');
        remaining /= 2.0;
      }
    }
    filters.push(`atempo=${remaining.toFixed(4)}`);

    ffmpeg(vocalPath)
      .audioFilters(filters.join(','))
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .output(outputPath)
      .on('end', () => {
        if (logger) logger.info('Vocal tempo-stretch complete', { ratio: ratio.toFixed(3) });
        resolve(outputPath);
      })
      .on('error', (err) => {
        if (logger) logger.warn('Tempo stretch failed, using original', { error: err.message });
        resolve(vocalPath); // Fallback to original
      })
      .run();
  });
}

/**
 * Detect the first strong beat (downbeat) in the instrumental and calculate
 * the silence padding needed to align vocal start to the beat grid.
 *
 * @param {string} beatPath - Path to instrumental audio
 * @param {number} bpm - BPM of the beat
 * @param {Object} logger - Logger instance
 * @returns {Promise<number>} Seconds of silence to prepend to vocals (0 if already aligned or detection fails)
 */
function detectDownbeatOffset(beatPath, bpm, logger) {
  return new Promise((resolve) => {
    try {
      const { execFile } = require('child_process');
      const ffmpegStatic = require('ffmpeg-static');

      // Use silencedetect to find the first non-silent moment (start of music)
      const analysisPath = beatPath + '.silence.txt';
      execFile(ffmpegStatic, [
        '-i', beatPath,
        '-af', `silencedetect=noise=-30dB:d=0.1`,
        '-f', 'null', '-'
      ], { timeout: 15000 }, (error, _stdout, stderr) => {
        // silencedetect outputs to stderr
        const output = stderr || '';
        const silenceEndMatch = output.match(/silence_end:\s*([\d.]+)/);

        if (silenceEndMatch) {
          const musicStart = parseFloat(silenceEndMatch[1]);
          // Beat interval in seconds
          const beatInterval = 60 / (bpm || 120);
          // Calculate how many beats of intro before vocals should start
          // Standard: vocals enter after 4 or 8 beats (1 or 2 bars in 4/4 time)
          const barsOfIntro = musicStart < beatInterval * 6 ? 1 : 2; // 1 bar for short intros, 2 for longer
          const vocalEntryPoint = musicStart + (beatInterval * 4 * barsOfIntro);

          if (logger) logger.info('Downbeat alignment calculated', {
            musicStart: musicStart.toFixed(3),
            beatInterval: beatInterval.toFixed(3),
            vocalEntryPoint: vocalEntryPoint.toFixed(3),
            barsOfIntro
          });

          resolve(vocalEntryPoint);
        } else {
          // No silence detected — music starts immediately, add 1 bar of intro
          const beatInterval = 60 / (bpm || 120);
          resolve(beatInterval * 4); // 1 bar
        }

        try { if (fs.existsSync(analysisPath)) fs.unlinkSync(analysisPath); } catch { /* best-effort temp cleanup */ }
      });
    } catch (err) {
      if (logger) logger.warn('Downbeat detection failed', { error: err.message });
      resolve(0);
    }
  });
}

/**
 * Add silence padding to the beginning of a vocal track for beat alignment.
 *
 * @param {string} vocalPath - Path to vocal audio
 * @param {number} paddingSeconds - Seconds of silence to prepend
 * @param {string} outputPath - Output path
 * @param {Object} logger - Logger instance
 * @returns {Promise<string>} Path to padded audio
 */
function padVocalStart(vocalPath, paddingSeconds, outputPath, logger) {
  return new Promise((resolve, _reject) => {
    if (!paddingSeconds || paddingSeconds <= 0 || paddingSeconds > 10) {
      resolve(vocalPath);
      return;
    }

    if (logger) logger.info('Padding vocal start for downbeat alignment', { paddingSeconds: paddingSeconds.toFixed(3) });

    ffmpeg(vocalPath)
      .audioFilters(`adelay=${Math.round(paddingSeconds * 1000)}|${Math.round(paddingSeconds * 1000)}`)
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .output(outputPath)
      .on('end', () => {
        if (logger) logger.info('Vocal padding complete');
        resolve(outputPath);
      })
      .on('error', (err) => {
        if (logger) logger.warn('Vocal padding failed, using original', { error: err.message });
        resolve(vocalPath);
      })
      .run();
  });
}

/**
 * Apply auto-tune effect to vocal audio using FFmpeg.
 * Uses a combination of effects to create the characteristic pitch-corrected sound.
 * NOT true per-note pitch correction — this is the aesthetic "auto-tune effect"
 * commonly heard in trap, R&B, and pop music.
 *
 * @param {string} vocalPath - Path to vocal audio
 * @param {string} genre - Musical genre (determines intensity of effect)
 * @param {string} outputPath - Output path
 * @param {Object} logger - Logger instance
 * @returns {Promise<string>} Path to processed audio
 */
function applyAutoTuneEffect(vocalPath, genre, outputPath, logger) {
  return new Promise((resolve, _reject) => {
    // Determine auto-tune intensity based on genre
    const genreLower = (genre || '').toLowerCase();

    // Skip auto-tune for spoken word, podcast, or explicit rap styles
    const skipGenres = ['podcast', 'spoken', 'audiobook', 'comedy', 'news'];
    if (skipGenres.some(g => genreLower.includes(g))) {
      resolve(vocalPath);
      return;
    }

    // Heavy auto-tune: trap, R&B, pop, electronic
    const heavyGenres = ['trap', 'r&b', 'rnb', 'pop', 'electronic', 'edm', 'future', 'cloud rap', 'auto'];
    // Medium auto-tune: hip-hop, rap, alternative, indie
    const mediumGenres = ['hip-hop', 'hip hop', 'rap', 'alternative', 'indie', 'rock'];
    // Light auto-tune: soul, jazz, country, folk (polish only)
    const lightGenres = ['soul', 'jazz', 'country', 'folk', 'acoustic', 'gospel', 'classical'];

    let intensity = 'medium'; // default
    if (heavyGenres.some(g => genreLower.includes(g))) intensity = 'heavy';
    else if (lightGenres.some(g => genreLower.includes(g))) intensity = 'light';
    else if (mediumGenres.some(g => genreLower.includes(g))) intensity = 'medium';

    if (logger) logger.info('Applying auto-tune vocal effect', { genre, intensity });

    // Build filter chain based on intensity
    const filters = [];

    // === STAGE 1: Vocal cleanup ===
    filters.push('highpass=f=80');  // Remove rumble
    filters.push('acompressor=threshold=-20dB:ratio=3:attack=5:release=50:makeup=2dB'); // Vocal compression

    if (intensity === 'heavy') {
      // === HEAVY AUTO-TUNE (Travis Scott / T-Pain / Future style) ===
      // Tight compression + sharp EQ + chorus for pitch "glue" + subtle vibrato modulation
      filters.push('equalizer=f=1000:width_type=o:width=0.5:g=2');   // Nasal/forward vocal push
      filters.push('equalizer=f=3500:width_type=o:width=1:g=4');     // Extreme presence boost
      filters.push('equalizer=f=8000:width_type=o:width=2:g=2');     // Air/shimmer
      filters.push('acompressor=threshold=-12dB:ratio=8:attack=1:release=30:makeup=4dB'); // Hard compression (squashes dynamics = auto-tune-like)
      filters.push('chorus=0.5:0.9:50|60:0.4|0.32:0.25|0.4:2|1.3'); // Slight pitch doubling for that "corrected" shimmer
      filters.push('vibrato=f=6.5:d=0.015');                         // Very subtle pitch wobble (mimics fast correction)
      filters.push('alimiter=limit=0.95:attack=2:release=20');       // Brick-wall limiter for consistent level
    } else if (intensity === 'medium') {
      // === MEDIUM AUTO-TUNE (Drake / Kanye / modern hip-hop) ===
      filters.push('equalizer=f=3000:width_type=o:width=1.5:g=3');   // Presence
      filters.push('equalizer=f=6000:width_type=o:width=2:g=1.5');   // Air
      filters.push('acompressor=threshold=-15dB:ratio=4:attack=3:release=60:makeup=3dB'); // Moderate compression
      filters.push('chorus=0.6:0.9:40:0.3:0.3:2');                   // Subtle doubling
      filters.push('alimiter=limit=0.95:attack=3:release=40');
    } else {
      // === LIGHT AUTO-TUNE (polish/warmth, no obvious effect) ===
      filters.push('equalizer=f=2500:width_type=o:width=2:g=1.5');   // Gentle presence
      filters.push('equalizer=f=200:width_type=o:width=1:g=-1');     // Cut mud
      filters.push('acompressor=threshold=-18dB:ratio=2:attack=10:release=100:makeup=2dB'); // Gentle compression
    }

    ffmpeg(vocalPath)
      .audioFilters(filters.join(','))
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .audioFrequency(44100)
      .output(outputPath)
      .on('end', () => {
        if (logger) logger.info('Auto-tune effect applied', { intensity });
        resolve(outputPath);
      })
      .on('error', (err) => {
        if (logger) logger.warn('Auto-tune effect failed, using original vocal', { error: err.message });
        resolve(vocalPath); // Fallback to original
      })
      .run();
  });
}

module.exports = {
  mixAudioProfessional,
  mixAudioFromUrls,
  mixMultipleStems,
  normalizeProducerTracks,
  buildMultiStemFilterGraph,
  getMixPreset,
  downloadAudio,
  detectBpmFromFile,
  tempoStretchVocal,
  detectDownbeatOffset,
  padVocalStart,
  applyAutoTuneEffect
};
