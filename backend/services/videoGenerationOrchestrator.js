/**
 * Video Generation Orchestrator
 * Manages multi-segment video generation, stitching, and beat sync
 * Handles orchestration of Replicate, Veo, and local composition
 */

const Replicate = require('replicate');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { analyzeMusicBeats } = require('./beatDetectionService');
const {
  composeVideoWithBeats,
  createBeatSyncedVideo,
  getVideoMetadata,
  downloadFile
} = require('./videoCompositionService');

let ffmpegReadyCache = null;

const DEFAULT_REPLICATE_SEGMENT_TIMEOUT_MS = 150000;
const REPLICATE_SEGMENT_TIMEOUT_MS = Math.max(
  30000,
  Math.min(Number(process.env.REPLICATE_SEGMENT_TIMEOUT_MS) || DEFAULT_REPLICATE_SEGMENT_TIMEOUT_MS, 240000)
);

function durationMs(startedAt) {
  return Math.max(0, Date.now() - startedAt);
}

function errorWithCode(message, code, extra = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extra);
  return error;
}

async function withTimeout(promise, timeoutMs, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(errorWithCode(
          `${label} timed out after ${Math.round(timeoutMs / 1000)} seconds.`,
          'PROVIDER_TIMEOUT'
        )), timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Resolve ffmpeg binary: prefer system PATH, fall back to ffmpeg-static npm package
function resolveFfmpegBinary() {
  // 1. Try system ffmpeg
  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf-8' });
  if (!probe.error && probe.status === 0) {
    return 'ffmpeg'; // system PATH
  }

  // 2. Try ffmpeg-static npm package
  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic) {
      const staticProbe = spawnSync(ffmpegStatic, ['-version'], { encoding: 'utf-8' });
      if (!staticProbe.error && staticProbe.status === 0) {
        return ffmpegStatic;
      }
    }
  } catch (_e) { /* not installed */ }

  return null;
}

// Quick readiness probe to fail fast when ffmpeg is missing
function ensureFfmpegAvailable(logger) {
  if (ffmpegReadyCache !== null) {
    return ffmpegReadyCache;
  }

  const binary = resolveFfmpegBinary();

  if (binary) {
    ffmpegReadyCache = true;
    if (logger) logger.info('FFmpeg detected for video orchestration', { binary: binary === 'ffmpeg' ? 'system' : 'ffmpeg-static' });
    return true;
  }

  ffmpegReadyCache = false;
  if (logger) logger.error('FFmpeg missing for video orchestration — install system ffmpeg or npm ffmpeg-static');
  throw new Error('FFmpeg is required for video composition and beat sync. Install system ffmpeg or ensure ffmpeg-static is in node_modules.');
}

async function runReplicateWithRateLimitRetry(replicate, model, input, logger, segmentNumber) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptStartedAt = Date.now();
    try {
      const output = await withTimeout(
        replicate.run(model, { input }),
        REPLICATE_SEGMENT_TIMEOUT_MS,
        `Video source shot ${segmentNumber}`
      );
      if (logger) logger.info('Replicate source shot completed', {
        segmentNumber,
        attempt,
        durationMs: durationMs(attemptStartedAt),
        outcome: 'success'
      });
      return output;
    } catch (error) {
      const message = String(error?.message || '');
      const isRateLimited = error?.status === 429 || error?.response?.status === 429 || /\b429\b|rate.?limit/i.test(message);
      if (logger) logger.warn('Replicate source shot attempt failed', {
        segmentNumber,
        attempt,
        durationMs: durationMs(attemptStartedAt),
        outcome: 'failed',
        code: error?.code || null,
        error: message || 'Unknown error'
      });
      if (!isRateLimited || attempt === maxAttempts) throw error;

      const retryMatch = message.match(/retry[_ -]?after[^0-9]*(\d+)/i);
      const retrySeconds = Math.max(Number(retryMatch?.[1]) || 10, 1);
      if (logger) logger.warn(`Replicate rate-limited segment ${segmentNumber}; retrying serially`, {
        attempt,
        retrySeconds
      });
      await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
    }
  }
  throw new Error(`Segment ${segmentNumber} exhausted Replicate retries`);
}

/**
 * Generate video segments using Replicate (Minimax or other models).
 * Every requested source shot is part of the customer's promised asset. Partial
 * provider success must never be reported as a normal completed video.
 */
async function generateVideoSegments(
  prompts, // Array of prompts for each segment
  duration = 6, // MiniMax Video-01 returns fixed six-second clips
  replicateKey,
  logger,
  imageUrl = null,
  videoUrl = null
) {
  const startedAt = Date.now();
  try {
    if (!replicateKey) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    if (logger) logger.info('Starting multi-segment video generation', {
      segments: prompts.length,
      durationPerSegment: duration,
      hasImageUrl: !!imageUrl,
      hasVideoUrl: !!videoUrl
    });

    const replicate = new Replicate({ auth: replicateKey });
    const segments = [];
    const failures = [];

    // Replicate accounts can advertise a burst limit of one request. Serial
    // generation avoids deterministic 429s on segments two and three.
    const BATCH_SIZE = 1;
    for (let batchStart = 0; batchStart < prompts.length; batchStart += BATCH_SIZE) {
      const batch = prompts.slice(batchStart, batchStart + BATCH_SIZE);
      if (logger) logger.info(`Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(prompts.length / BATCH_SIZE)} (segments ${batchStart + 1}-${batchStart + batch.length})`);

      const batchResults = await Promise.allSettled(
        batch.map((prompt, idx) => {
          const globalIdx = batchStart + idx;

          // If we have a videoUrl and it's the first segment, use it instead of generating
          if (globalIdx === 0 && videoUrl) {
            if (logger) logger.info('Using provided videoUrl for first segment');
            return Promise.resolve({
              url: videoUrl,
              prompt,
              duration,
              segmentIndex: 0
            });
          }

          const inputPayload = {
            prompt,
            prompt_optimizer: true,
            duration: 6,
            resolution: '768p'
          };

          // Use image as first frame for EVERY segment to maintain visual identity
          // This ensures the artist's look is consistent throughout the entire video
          if (imageUrl) {
            inputPayload.first_frame_image = imageUrl;
          }

          // The old video-01 model routinely takes 2.5-5 minutes for a six-second
          // clip. Hailuo 2.3 Fast handles the normal image-led package path;
          // current Hailuo 2.3 handles text-only generation.
          const segmentModel = imageUrl ? 'minimax/hailuo-2.3-fast' : 'minimax/hailuo-2.3';
          return runReplicateWithRateLimitRetry(replicate, segmentModel, inputPayload, logger, globalIdx + 1)
            .then(output => {
              if (logger) logger.info(`Segment ${globalIdx + 1} generated`, { url: String(output) });
              return {
                url: String(output),
                prompt,
                duration: 6,
                segmentIndex: globalIdx
              };
            });
        })
      );

      // Collect successful results and failures in order. A later source-shot
      // failure is no longer silently ignored; the complete-asset contract below
      // prevents a false-green result.
      for (let localIndex = 0; localIndex < batchResults.length; localIndex++) {
        const result = batchResults[localIndex];
        const failedIdx = batchStart + localIndex;
        if (result.status === 'fulfilled' && result.value) {
          segments.push(result.value);
        } else if (result.status === 'rejected') {
          const failure = {
            segmentIndex: failedIdx,
            segmentNumber: failedIdx + 1,
            error: result.reason?.message || 'Unknown error',
            code: result.reason?.code || null
          };
          failures.push(failure);
          if (logger) logger.error(`Failed to generate segment ${failedIdx + 1}`, failure);
        }
      }

      // Brief pause between batches to avoid rate limits
      if (batchStart + BATCH_SIZE < prompts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (segments.length === 0) {
      throw errorWithCode('No video segments generated successfully', 'NO_SEGMENTS_GENERATED', { failures });
    }

    if (failures.length > 0 || segments.length !== prompts.length) {
      const incomplete = errorWithCode(
        `Video generation incomplete: ${segments.length}/${prompts.length} source shots completed. No completed video was published.`,
        'PARTIAL_SEGMENT_FAILURE',
        {
          failures,
          completedSegments: segments.map(segment => ({
            segmentIndex: segment.segmentIndex,
            url: segment.url
          }))
        }
      );
      if (logger) logger.error('Video source-shot contract failed', {
        requestedSegments: prompts.length,
        completedSegments: segments.length,
        failedSegments: failures.length,
        durationMs: durationMs(startedAt),
        outcome: 'failed'
      });
      throw incomplete;
    }

    if (logger) logger.info('All video source shots generated', {
      count: segments.length,
      durationMs: durationMs(startedAt),
      outcome: 'success'
    });
    return segments;

  } catch (error) {
    if (logger) logger.error('Video segment generation failed', {
      error: error.message,
      code: error?.code || null,
      durationMs: durationMs(startedAt),
      outcome: 'failed'
    });
    throw error;
  }
}

/**
 * Generate a single long-form video by creating a complex prompt
 * Fallback when segmentation doesn't work well
 */
async function generateSingleVideo(
  prompt,
  duration = 30, // Up to 30 seconds
  replicateKey,
  model = 'minimax/hailuo-2.3',
  logger
) {
  const startedAt = Date.now();
  try {
    if (!replicateKey) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    if (logger) logger.info('Generating single video', {
      prompt: prompt.substring(0, 50),
      duration,
      model
    });

    const replicate = new Replicate({ auth: replicateKey });

    const effectiveDuration = model.includes('minimax') ? 6 : duration;

    const output = await withTimeout(
      replicate.run(model, {
        input: {
          prompt,
          prompt_optimizer: true,
          duration: 6,
          resolution: '768p'
        }
      }),
      REPLICATE_SEGMENT_TIMEOUT_MS,
      'Single video source shot'
    );

    if (logger) logger.info('Single video generated', {
      url: String(output),
      duration: effectiveDuration,
      durationMs: durationMs(startedAt),
      outcome: 'success'
    });

    return {
      url: String(output),
      prompt,
      duration: effectiveDuration,
      model
    };

  } catch (error) {
    if (logger) logger.error('Single video generation failed', {
      error: error.message,
      code: error?.code || null,
      durationMs: durationMs(startedAt),
      outcome: 'failed'
    });
    throw error;
  }
}

/**
 * Main orchestrator: Generate synced music video
 * Handles audio analysis, video generation, composition
 */
async function generateSyncedMusicVideo(
  audioUrl, // URL to beat audio
  videoPrompt, // Text description of video concept
  songTitle, // Title for metadata
  requestedDuration = 30, // 30, 60, or 180 seconds
  replicateKey,
  logger,
  imageUrl = null,
  videoUrl = null
) {
  const tempDir = path.join(__dirname, '../../backend', 'temp');
  const outputDir = path.join(__dirname, '../../backend', 'videos');
  const pipelineStartedAt = Date.now();
  const phaseMs = {};
  
  // Create directories
  [tempDir, outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  try {
    ensureFfmpegAvailable(logger);

    if (logger) logger.info('Starting synced music video generation', {
      duration: requestedDuration,
      audioUrl: audioUrl.substring(0, 50),
      prompt: videoPrompt.substring(0, 50),
      providerTimeoutMs: REPLICATE_SEGMENT_TIMEOUT_MS
    });

    // Step 1: Analyze music beats
    if (logger) logger.info('Step 1: Analyzing music beats...');
    let phaseStartedAt = Date.now();
    const beatAnalysis = await analyzeMusicBeats(audioUrl, logger);
    phaseMs.beatAnalysis = durationMs(phaseStartedAt);
    
    if (logger) logger.info('Beat analysis complete', {
      bpm: beatAnalysis.bpm,
      beats: beatAnalysis.beats.length,
      confidence: beatAnalysis.confidence,
      durationMs: phaseMs.beatAnalysis
    });

    // Download audio for sync. A "synced music video" without its requested
    // audio is not a successful asset, so this is a hard contract instead of a
    // warning/fallback.
    const localAudioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);
    phaseStartedAt = Date.now();
    try {
      if (logger) logger.info('Downloading audio for sync...', { url: audioUrl.substring(0, 50) });
      await downloadFile(audioUrl, localAudioPath);
      phaseMs.audioDownload = durationMs(phaseStartedAt);
    } catch (audioDlError) {
      phaseMs.audioDownload = durationMs(phaseStartedAt);
      throw errorWithCode(
        `Could not download the song audio for video sync: ${audioDlError.message}`,
        'AUDIO_DOWNLOAD_FAILED'
      );
    }

    // Step 2: Determine video segmentation strategy
    let videoSegments = [];
    const timelineSegments = Math.max(1, Math.ceil(requestedDuration / 6));
    // Video-01 regularly takes 90+ seconds per six-second shot. Generating
    // every timeline segment serially made a 30-second video take ~10 minutes.
    // Generate at most two distinct shots, then edit/repeat them to length.
    const generatedSegmentCount = Math.min(2, timelineSegments);

    if (logger) logger.info('Step 2: Generating video segments', {
      totalDuration: requestedDuration,
      timelineSegments,
      generatedSegmentCount
    });

    // Generate prompts for each segment (beat-aware)
    const segmentPrompts = generateSegmentedPrompts(
      videoPrompt,
      generatedSegmentCount,
      beatAnalysis.bpm,
      logger
    );

    // Generate video segments
    phaseStartedAt = Date.now();
    videoSegments = await generateVideoSegments(
      segmentPrompts,
      6,
      replicateKey,
      logger,
      imageUrl,
      videoUrl
    );
    phaseMs.sourceShots = durationMs(phaseStartedAt);

    // Step 3: Compose video with beat sync
    if (logger) logger.info('Step 3: Composing video with beat sync...');
    
    const outputVideoPath = path.join(
      outputDir,
      `music-video_${Date.now()}.mp4`
    );

    // Download video segments for local composition
    const downloadedSourceSegments = [];
    phaseStartedAt = Date.now();
    for (let i = 0; i < videoSegments.length; i++) {
      const segPath = path.join(tempDir, `segment_${i}_${Date.now()}.mp4`);
      
      try {
        if (logger) logger.info(`Downloading segment ${i + 1}/${videoSegments.length}...`);
        await downloadFile(videoSegments[i].url, segPath);
        
        downloadedSourceSegments.push({
          path: segPath,
          duration: videoSegments[i].duration,
          beatMarkers: alignBeatsToSegment(beatAnalysis.beats, i, timelineSegments)
        });
      } catch (dlError) {
        throw errorWithCode(
          `Could not download generated source shot ${i + 1}: ${dlError.message}`,
          'SEGMENT_DOWNLOAD_FAILED',
          { segmentNumber: i + 1 }
        );
      }
    }
    phaseMs.segmentDownloads = durationMs(phaseStartedAt);

    // Tile the bounded source shots across the requested timeline. This keeps
    // the full audio/video duration while avoiding six paid, slow generations.
    const downloadedSegments = Array.from({ length: timelineSegments }, (_, i) => ({
      ...downloadedSourceSegments[i % downloadedSourceSegments.length],
      beatMarkers: alignBeatsToSegment(beatAnalysis.beats, i, timelineSegments)
    }));

    // Compose with beat sync. A failed composition means the requested full
    // duration was not created, so falling back to a six-second source shot would
    // be a false success.
    let finalVideoUrl = videoSegments[0].url;
    phaseStartedAt = Date.now();
    try {
      const composed = await composeVideoWithBeats(
        downloadedSegments,
        localAudioPath,
        outputVideoPath,
        beatAnalysis.beats,
        logger
      );
      finalVideoUrl = composed.outputPath;
      phaseMs.composition = durationMs(phaseStartedAt);

      if (logger) logger.info('Video composition successful', {
        output: finalVideoUrl,
        durationMs: phaseMs.composition
      });
    } catch (composeError) {
      phaseMs.composition = durationMs(phaseStartedAt);
      throw errorWithCode(
        `Video composition failed: ${composeError.message}`,
        'COMPOSITION_FAILED'
      );
    }

    // Step 4: Apply beat sync effects. This route promises a synced video; a
    // failure here is not silently downgraded to an unsynced result.
    if (logger) logger.info('Step 4: Applying beat sync effects...');
    
    const syncedVideoPath = path.join(
      outputDir,
      `music-video-synced_${Date.now()}.mp4`
    );

    phaseStartedAt = Date.now();
    try {
      const synced = await createBeatSyncedVideo(
        finalVideoUrl,
        localAudioPath,
        beatAnalysis.beats,
        syncedVideoPath,
        logger
      );

      finalVideoUrl = synced.outputPath;
      phaseMs.beatSync = durationMs(phaseStartedAt);

      if (logger) logger.info('Beat sync applied', {
        beats: synced.beatCount,
        durationMs: phaseMs.beatSync
      });
    } catch (syncError) {
      phaseMs.beatSync = durationMs(phaseStartedAt);
      throw errorWithCode(
        `Beat sync failed: ${syncError.message}`,
        'BEAT_SYNC_FAILED'
      );
    }

    // Step 5: Get final metadata
    if (logger) logger.info('Step 5: Finalizing video...');
    
    let metadata = {};
    let metadataWarning = null;
    phaseStartedAt = Date.now();
    try {
      metadata = await getVideoMetadata(finalVideoUrl, logger);
    } catch (metaError) {
      metadataWarning = metaError.message || 'Could not extract final video metadata.';
      if (logger) logger.warn('Could not extract metadata', {
        error: metadataWarning
      });
    }
    phaseMs.metadata = durationMs(phaseStartedAt);

    const result = {
      success: true,
      quality: 'complete',
      videoUrl: finalVideoUrl,
      duration: Math.min(requestedDuration, metadata.duration || requestedDuration),
      requestedDuration,
      bpm: beatAnalysis.bpm,
      beatCount: beatAnalysis.beats.length,
      segments: timelineSegments,
      generatedSegments: videoSegments.length,
      metadata,
      ...(metadataWarning ? { metadataWarning } : {}),
      phaseMs,
      totalDurationMs: durationMs(pipelineStartedAt),
      timestamp: new Date().toISOString()
    };

    if (logger) logger.info('Music video generation complete', result);
    return result;

  } catch (error) {
    const failure = {
      success: false,
      quality: 'failed',
      code: error?.code || 'VIDEO_GENERATION_FAILED',
      error: error.message,
      details: error.stack,
      failedSegments: error?.failures || undefined,
      completedSegments: error?.completedSegments || undefined,
      phaseMs,
      totalDurationMs: durationMs(pipelineStartedAt)
    };
    if (logger) logger.error('Music video generation failed', failure);
    throw failure;
  }
}

/**
 * Generate segment-specific prompts based on beat analysis
 */
function generateSegmentedPrompts(basePrompt, numSegments, bpm, logger) {
  const prompts = [];
  const transitions = [
    'energetic intro',
    'build-up sequence',
    'main climax drop',
    'dynamic resolution',
    'outro fade'
  ];

  // 100% CLONE ALIGNMENT: Every segment must maintain strict visual identity with the reference
  const cloneEnforcement = 'STRICT VISUAL IDENTITY CLONE: The person, face, style, outfit, colors, and overall look MUST remain identical to the reference image throughout. Do NOT change the artist appearance. Do NOT reinterpret or alter facial features, skin tone, clothing, or style.';

  for (let i = 0; i < numSegments; i++) {
    const transitionType = transitions[Math.min(i, transitions.length - 1)];
    const styleModifier = bpm > 110 ? 'strobe lights, clubbing atmosphere, high energy' : 'smooth cinematic motion, slow pan';
    const prompt = `${cloneEnforcement} ${basePrompt} (${transitionType}, ${styleModifier}, BPM ${bpm}, segment ${i + 1}/${numSegments}, 16:9)`;
    prompts.push(prompt);

    if (logger) logger.debug(`Segment ${i + 1} prompt:`, { prompt: prompt.substring(0, 80) });
  }

  return prompts;
}

/**
 * Align beat markers to specific video segment
 */
function alignBeatsToSegment(allBeats, segmentIndex, totalSegments) {
  const segmentDuration = (allBeats[allBeats.length - 1] || 30000) / totalSegments;
  const segmentStart = segmentIndex * segmentDuration;
  const segmentEnd = (segmentIndex + 1) * segmentDuration;

  return allBeats.filter(beat => beat >= segmentStart && beat < segmentEnd)
    .map(beat => beat - segmentStart); // Relative to segment start
}

module.exports = {
  generateVideoSegments,
  generateSingleVideo,
  generateSyncedMusicVideo,
  generateSegmentedPrompts,
  alignBeatsToSegment,
  REPLICATE_SEGMENT_TIMEOUT_MS
};
