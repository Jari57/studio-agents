const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const Replicate = require('replicate');

/**
 * CREME DE LA CREME — SYNC SERVICE
 * Orchestrates the high-end synchronization of Mastered Audio, 
 * AI Video, and Beat-synced visual effects.
 */

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Performs high-precision audio/video muxing with beat-synced visual pulses.
 * @param {Object} options { audioPath, videoPath, outputPath, beats, bpm, energy }
 */
async function createBillboardSyncVideo(options, logger) {
  const { audioPath, videoPath, outputPath, beats = [], bpm = 120, energy = 5 } = options;
  
  return new Promise((resolve, reject) => {
    try {
      if (!audioPath || !videoPath) {
        return reject(new Error('Audio and Video paths are required for sync'));
      }

      // Billboard-grade Sync Logic:
      // 1. Dynamic sidechain-style visual pulsing on the beat.
      // 2. High-fidelity audio muxing with zero-latency alignment.
      // 3. Sub-frame precision visual cuts.

      let filterParams = [];
      const bpmInterval = 60 / bpm; // seconds between beats
      
      // Generate visual pulses based on beats or BPM if beats are missing
      const pulses = beats.length > 0 ? beats.slice(0, 50) : Array.from({ length: 40 }, (_, i) => i * bpmInterval);
      
      let flashFilters = [];
      pulses.forEach((time) => {
        // Higher energy flash (0.12s duration) for Billboard impact
        const startTime = parseFloat(time).toFixed(3);
        const endTime = (parseFloat(time) + 0.120).toFixed(3);
        flashFilters.push(`between(t,${startTime},${endTime})`);
      });

      const flashExpression = flashFilters.join('+');
      
      // ── ULTRA-GRADE CINEMATIC FILTER STRINGS ──
      // 1. ANAMORPHIC RED/BLUE SHIFT: Nudging blue/red channels for dreamy lens dispersion
      const chromaticAberration = "chromashift=cbh=2:cbv=1:crh=-2:crv=-1";

      // 2. KODAK 500T FILM GRAIN: Organic moving temporal noise (not static)
      const filmGrain = "noise=alls=8:allp=t+u";

      // 3. VIGNETTE & BLOOM: Center focus and soft spreading highlights
      const vignette = "vignette=PI/4";
      const bloom = "unsharp=7:7:1.2:7:7:1.0:b=1"; // High-end "pop" sharpening

      // 4. BEAT-SYNCED GLITCH (Digital distortion overlay)
      // We use a split-and-overlay technique to shift pixels on the beat.

      if (logger) logger.info('🎬 Building "Creme de la Creme" Cinematic Pipeline', { bpm, beats: pulses.length });

      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .complexFilter([
          // Base Scaling & Cine-Cropping
          {
            filter: 'scale',
            options: '1280:720:force_original_aspect_ratio=increase,crop=1280:720',
            inputs: '0:v',
            outputs: 'v0'
          },
          // 1. Color and Flash Processing
          {
            filter: 'eq',
            options: {
              brightness: `if(${flashExpression}, 0.12, 0)`,
              contrast: `if(${flashExpression}, 1.25, 1.0)`,
              saturation: `if(${flashExpression}, 1.15, 1.0)`
            },
            inputs: 'v0',
            outputs: 'v1'
          },
          // 2. Chromatic Aberration & Grain
          { filter: chromaticAberration, inputs: 'v1', outputs: 'v2' },
          { filter: filmGrain, inputs: 'v2', outputs: 'v3' },
          { filter: vignette, inputs: 'v3', outputs: 'v4' },
          { filter: bloom, inputs: 'v4', outputs: 'v5' },
          // 3. Digital Glitch (Overlay Layer)
          {
            filter: 'split',
            inputs: 'v5',
            outputs: ['base', 'glitch']
          },
          {
            filter: 'hue',
            options: 'h=90',
            inputs: 'glitch',
            outputs: 'glitched_hue'
          },
          {
            filter: 'overlay',
            options: {
              x: `if(${flashExpression}, (random(0)*30-15), 0)`,
              y: `if(${flashExpression}, (random(1)*20-10), 0)`,
              alpha: `if(${flashExpression}, 0.4, 0)`
            },
            inputs: ['base', 'glitched_hue'],
            outputs: 'v_final'
          }
        ], 'v_final')
        .outputOptions([
          },
          {
            filter: vignette,
            inputs: 'v_grained',
            outputs: 'v_vignetted'
          },
          {
            filter: bloom,
            inputs: 'v_vignetted',
            outputs: 'v_bloomed'
          },
          {
            filter: 'split',
            inputs: 'v_bloomed',
            outputs: ['v_pre_glitch', 'v_glitch_source']
          },
          {
            filter: 'hue',
            options: 'h=90',
            inputs: 'v_glitch_source',
            outputs: 'v_glitch_hued'
          },
          {
            filter: 'scale',
            options: 'iw/2:ih/2',
            inputs: 'v_glitch_hued',
            outputs: 'v_glitch_scaled_down'
          },
          {
            filter: 'scale',
            options: '1280:720',
            inputs: 'v_glitch_scaled_down',
            outputs: 'v_glitch_scaled_up'
          },
          {
            filter: 'overlay',
            options: {
              x: `if(${flashExpression}, (random(0)*20)-10, 0)`,
              y: `if(${flashExpression}, (random(0)*20)-10, 0)`,
              enable: flashExpression
            },
            inputs: ['v_pre_glitch', 'v_glitch_scaled_up'],
            outputs: 'v_final'
          }
        ], 'v_final')
        .outputOptions([
          '-map 1:a', // Take audio from 2nd input
          '-c:v libx264',
          '-preset fast',
          '-crf 18', // High quality visual
          '-pix_fmt yuv420p',
          '-shortest' // End when shortest input ends
        ])
        .audioCodec('aac')
        .audioBitrate('256k')
        .on('start', (cmd) => { if (logger) logger.info('🚀 Sync engine started', { cmd: cmd.substring(0, 100) }); })
        .on('error', (err) => { reject(err); })
        .on('end', () => { resolve(outputPath); })
        .save(outputPath);

    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Performs AI-powered Lip Sync (Wav2Lip) on a video using a mastered audio track.
 * This is the "Creme de la Creme" for high-end music video production.
 */
async function performAILipSync(videoUrl, audioUrl, logger) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN missing for AI Lip Sync');
  }

  if (logger) logger.info('👄 Initializing AI Lip Sync (Creme de la Creme mode)...', { videoUrl });

  try {
    // Using wav2lip model on Replicate for best-in-class sync
    const output = await replicate.run(
      "lucataco/wav2lip:84a5690b232677dd327a3c7784f183984d47f9ba57954a78c187e1488c94e01b",
      {
        input: {
          face: videoUrl,
          audio: audioUrl,
          pads: "0 10 0 0",
          smooth: true,
          resize_factor: 1
        }
      }
    );

    if (logger) logger.info('✅ AI Lip Sync complete', { output });
    return output; // This is the URL to the synced video
  } catch (err) {
    if (logger) logger.error('❌ AI Lip Sync failed', { error: err.message });
    throw err;
  }
}

module.exports = {
  createBillboardSyncVideo,
  performAILipSync
};
