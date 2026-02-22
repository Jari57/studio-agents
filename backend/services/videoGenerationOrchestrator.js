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

/**
 * Generate video segments using Replicate (Minimax or other models)
 * Handles automatic retries and fallback logic
 */
async function generateVideoSegments(
  prompts, // Array of prompts for each segment
  duration = 5, // Duration per segment in seconds
  replicateKey,
  logger,
  imageUrl = null,
  videoUrl = null
) {
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

    // Generate segments in parallel batches of 3 for speed
    const BATCH_SIZE = 3;
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
            duration: Math.min(duration, 5) // Minimax max is 5s
          };

          // Use image as first frame if provided (first segment only)
          if (globalIdx === 0 && imageUrl) {
            inputPayload.first_frame_image = imageUrl;
          }

          return replicate.run("minimax/video-01", { input: inputPayload })
            .then(output => {
              if (logger) logger.info(`Segment ${globalIdx + 1} generated`, { url: String(output) });
              return {
                url: String(output),
                prompt,
                duration,
                segmentIndex: globalIdx
              };
            });
        })
      );

      // Collect successful results in order
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          segments.push(result.value);
        } else if (result.status === 'rejected') {
          const failedIdx = batchStart + batchResults.indexOf(result);
          if (logger) logger.error(`Failed to generate segment ${failedIdx + 1}`, {
            error: result.reason?.message || 'Unknown error'
          });
          // First segment must succeed
          if (failedIdx === 0) {
            throw result.reason || new Error('First segment generation failed');
          }
        }
      }

      // Brief pause between batches to avoid rate limits
      if (batchStart + BATCH_SIZE < prompts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (segments.length === 0) {
      throw new Error('No video segments generated successfully');
    }

    if (logger) logger.info('All segments generated', { count: segments.length });
    return segments;

  } catch (error) {
    if (logger) logger.error('Video segment generation failed', {
      error: error.message
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
  model = 'minimax/video-01',
  logger
) {
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

    // Cap duration at model limits
    let effectiveDuration = duration;
    if (model.includes('minimax')) {
      effectiveDuration = Math.min(duration, 5); // Minimax max is 5s
    }

    const output = await replicate.run(model, {
      input: {
        prompt,
        prompt_optimizer: true,
        duration: effectiveDuration
      }
    });

    if (logger) logger.info('Single video generated', {
      url: String(output),
      duration: effectiveDuration
    });

    return {
      url: String(output),
      prompt,
      duration: effectiveDuration,
      model
    };

  } catch (error) {
    if (logger) logger.error('Single video generation failed', {
      error: error.message
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
      prompt: videoPrompt.substring(0, 50)
    });

    // Step 1: Analyze music beats
    if (logger) logger.info('Step 1: Analyzing music beats...');
    const beatAnalysis = await analyzeMusicBeats(audioUrl, logger);
    
    if (logger) logger.info('Beat analysis complete', {
      bpm: beatAnalysis.bpm,
      beats: beatAnalysis.beats.length,
      confidence: beatAnalysis.confidence
    });

    // Download audio for sync
    const localAudioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);
    try {
      if (logger) logger.info('Downloading audio for sync...', { url: audioUrl.substring(0, 50) });
      await downloadFile(audioUrl, localAudioPath);
    } catch (audioDlError) {
      if (logger) logger.warn('Failed to download audio, sync may lack audio', { error: audioDlError.message });
    }

    // Step 2: Determine video segmentation strategy
    let videoSegments = [];
    const numSegments = Math.ceil(requestedDuration / 5); // Each segment is max 5s

    if (logger) logger.info('Step 2: Generating video segments', {
      totalDuration: requestedDuration,
      numSegments
    });

    // Generate prompts for each segment (beat-aware)
    const segmentPrompts = generateSegmentedPrompts(
      videoPrompt,
      numSegments,
      beatAnalysis.bpm,
      logger
    );

    // Generate video segments
    videoSegments = await generateVideoSegments(
      segmentPrompts,
      Math.ceil(requestedDuration / numSegments),
      replicateKey,
      logger,
      imageUrl,
      videoUrl
    );

    // Step 3: Compose video with beat sync
    if (logger) logger.info('Step 3: Composing video with beat sync...');
    
    const outputVideoPath = path.join(
      outputDir,
      `music-video_${Date.now()}.mp4`
    );

    // Download video segments for local composition
    const downloadedSegments = [];
    for (let i = 0; i < videoSegments.length; i++) {
       const segPath = path.join(tempDir, `segment_${i}_${Date.now()}.mp4`);
      
      try {
        if (logger) logger.info(`Downloading segment ${i+1}/${videoSegments.length}...`);
        await downloadFile(videoSegments[i].url, segPath);
        
        downloadedSegments.push({
          path: segPath,
          duration: videoSegments[i].duration,
          beatMarkers: alignBeatsToSegment(beatAnalysis.beats, i, numSegments)
        });
      } catch (dlError) {
        if (logger) logger.warn(`Failed to download segment ${i}`, {
          error: dlError.message
        });
        // Try fallback to URL
        downloadedSegments.push({
          path: videoSegments[i].url,
          duration: videoSegments[i].duration,
          beatMarkers: alignBeatsToSegment(beatAnalysis.beats, i, numSegments)
        });
      }
    }

    // Compose with beat sync
    let finalVideoUrl = videoSegments[0].url; // Use first segment as base for now
    
    // If multiple segments, try to compose
    if (downloadedSegments.length > 0) {
      try {
        const composed = await composeVideoWithBeats(
          downloadedSegments,
          fs.existsSync(localAudioPath) ? localAudioPath : null,
          outputVideoPath,
          beatAnalysis.beats,
          logger
        );
        finalVideoUrl = composed.outputPath;

        if (logger) logger.info('Video composition successful', {
          output: finalVideoUrl
        });
      } catch (composeError) {
        if (logger) logger.error('Video composition failed', {
          error: composeError.message
        });
        // Fall back to first segment
      }
    }

    // Step 4: Apply beat sync effects
    if (logger) logger.info('Step 4: Applying beat sync effects...');
    
    const syncedVideoPath = path.join(
      outputDir,
      `music-video-synced_${Date.now()}.mp4`
    );

    try {
      const synced = await createBeatSyncedVideo(
        finalVideoUrl,
        fs.existsSync(localAudioPath) ? localAudioPath : null,
        beatAnalysis.beats,
        syncedVideoPath,
        logger
      );

      finalVideoUrl = synced.outputPath;

      if (logger) logger.info('Beat sync applied', {
        beats: synced.beatCount
      });
    } catch (syncError) {
      if (logger) logger.warn('Beat sync failed, using composed video', {
        error: syncError.message
      });
    }

    // Step 5: Get final metadata
    if (logger) logger.info('Step 5: Finalizing video...');
    
    let metadata = {};
    try {
      metadata = await getVideoMetadata(finalVideoUrl, logger);
    } catch (metaError) {
      if (logger) logger.warn('Could not extract metadata', {
        error: metaError.message
      });
    }

    const result = {
      success: true,
      videoUrl: finalVideoUrl,
      duration: Math.min(requestedDuration, metadata.duration || requestedDuration),
      bpm: beatAnalysis.bpm,
      beatCount: beatAnalysis.beats.length,
      segments: videoSegments.length,
      metadata,
      timestamp: new Date().toISOString()
    };

    if (logger) logger.info('Music video generation complete', result);
    return result;

  } catch (error) {
    if (logger) logger.error('Music video generation failed', {
      error: error.message,
      stack: error.stack
    });
    
    throw {
      success: false,
      error: error.message,
      details: error.stack
    };
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

  for (let i = 0; i < numSegments; i++) {
    const transitionType = transitions[Math.min(i, transitions.length - 1)];
    const styleModifier = bpm > 110 ? 'strobe lights, clubbing atmosphere, high energy' : 'smooth cinematic motion, slow pan';
    const prompt = `${basePrompt} (${transitionType}, ${styleModifier}, BPM ${bpm}, segment ${i + 1}/${numSegments}, 16:9)`;
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
  alignBeatsToSegment
};
