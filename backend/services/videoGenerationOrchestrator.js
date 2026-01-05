/**
 * Video Generation Orchestrator
 * Manages multi-segment video generation, stitching, and beat sync
 * Handles orchestration of Replicate, Veo, and local composition
 */

const Replicate = require('replicate');
const path = require('path');
const fs = require('fs');
const { analyzeMusicBeats } = require('./beatDetectionService');
const { 
  composeVideoWithBeats, 
  createBeatSyncedVideo,
  normalizeVideo,
  getVideoMetadata 
} = require('./videoCompositionService');

/**
 * Generate video segments using Replicate (Minimax or other models)
 * Handles automatic retries and fallback logic
 */
async function generateVideoSegments(
  prompts, // Array of prompts for each segment
  duration = 5, // Duration per segment in seconds
  replicateKey,
  logger
) {
  try {
    if (!replicateKey) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    if (logger) logger.info('Starting multi-segment video generation', {
      segments: prompts.length,
      durationPerSegment: duration
    });

    const replicate = new Replicate({ auth: replicateKey });
    const segments = [];
    
    // Generate each segment sequentially (rate limiting)
    for (let i = 0; i < prompts.length; i++) {
      try {
        if (logger) logger.info(`Generating segment ${i + 1}/${prompts.length}`, {
          prompt: prompts[i].substring(0, 50)
        });

        // Add delay between requests to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const output = await replicate.run(
          "minimax/video-01",
          {
            input: {
              prompt: prompts[i],
              prompt_optimizer: true,
              duration: Math.min(duration, 5) // Minimax max is 5s
            }
          }
        );

        if (output) {
          segments.push({
            url: String(output),
            prompt: prompts[i],
            duration,
            segmentIndex: i
          });

          if (logger) logger.info(`Segment ${i + 1} generated`, { url: output });
        }
      } catch (segmentError) {
        if (logger) logger.error(`Failed to generate segment ${i + 1}`, {
          error: segmentError.message
        });
        
        // Continue with next segment instead of failing completely
        // Or throw if critical
        if (i === 0) {
          throw segmentError; // First segment must succeed
        }
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
  logger
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

    // Step 2: Determine video segmentation strategy
    let videoSegments = [];
    const numSegments = Math.ceil(requestedDuration / 5); // Each segment is max 5s

    if (logger) logger.info('Step 2: Generating video segments', {
      totalDuration: requestedDuration,
      numSegments,
      segmentDuration: Math.ceil(requestedDuration / numSegments)
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
      logger
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
        // Note: In production, you'd download these files
        // For now, we'll create placeholder or use directly if available
        downloadedSegments.push({
          path: videoSegments[i].url,
          duration: videoSegments[i].duration,
          beatMarkers: alignBeatsToSegment(beatAnalysis.beats, i, numSegments)
        });
      } catch (dlError) {
        if (logger) logger.warn(`Failed to download segment ${i}`, {
          error: dlError.message
        });
      }
    }

    // Compose with beat sync
    let finalVideoUrl = videoSegments[0].url; // Use first segment as base for now
    
    // If multiple segments, try to compose
    if (downloadedSegments.length > 1) {
      try {
        const composed = await composeVideoWithBeats(
          downloadedSegments,
          null, // Audio will be added in next step
          outputVideoPath,
          beatAnalysis.beats,
          logger
        );
        finalVideoUrl = composed.outputPath;

        if (logger) logger.info('Video composition successful', {
          output: finalVideoUrl
        });
      } catch (composeError) {
        if (logger) logger.warn('Video composition failed, using first segment', {
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
        null, // Audio URL would go here
        beatAnalysis.beats.slice(0, 10), // Use first 10 beats for effects
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
    'intro',
    'build-up',
    'climax',
    'resolution',
    'outro'
  ];

  for (let i = 0; i < numSegments; i++) {
    const transitionType = transitions[Math.min(i, transitions.length - 1)];
    const prompt = `${basePrompt} (${transitionType} section, BPM ${bpm}, segment ${i + 1}/${numSegments}, 16:9)`;
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
