/**
 * Professional Audio Mixing & Mastering Service
 * Mixes vocals + beats with Billboard-level quality
 * Features: Auto-ducking, compression, EQ, loudness normalization (LUFS)
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

/**
 * Download audio file from URL
 */
function downloadAudio(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
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
      let filterComplex = [];

      // === TRACK PROCESSING ===

      // Vocal processing
      let vocalFilters = `[0:a]volume=${vocalVolume}`;

      // Add vocal EQ boost (presence and clarity)
      vocalFilters += `,equalizer=f=3000:width_type=o:width=2:g=2`; // Boost presence (3kHz)
      vocalFilters += `,equalizer=f=200:width_type=o:width=1:g=-1`; // Cut muddiness (200Hz)

      // Add de-esser (reduce harsh S sounds)
      vocalFilters += `,equalizer=f=8000:width_type=o:width=2:g=-2`; // Soften highs

      vocalFilters += `[vocal]`;
      filterComplex.push(vocalFilters);

      // Beat processing
      let beatFilters = `[1:a]volume=${beatVolume}`;

      // Beat EQ (sub bass boost + high-end clarity)
      beatFilters += `,equalizer=f=60:width_type=o:width=1:g=3`; // Sub bass boost
      beatFilters += `,equalizer=f=10000:width_type=o:width=2:g=1`; // High-end shine

      beatFilters += `[beat]`;
      filterComplex.push(beatFilters);

      // === AUTO-DUCKING ===
      // When vocals play, slightly reduce beat volume for clarity
      if (autoDuck) {
        // Use sidechaincompress to duck beat when vocals are present
        filterComplex.push(`[beat][vocal]sidechaincompress=threshold=0.15:ratio=2.5:attack=15:release=350:makeup=1.5[beat_ducked]`);
        filterComplex.push(`[vocal][beat_ducked]amix=inputs=2:duration=longest:weights=1.0 0.95[mixed]`);
      } else {
        // Simple mix without ducking
        filterComplex.push(`[vocal][beat]amix=inputs=2:duration=longest[mixed]`);
      }

      // === COMPRESSION ===
      // Professional mastering-grade compression
      if (compression) {
        filterComplex.push(`[mixed]acompressor=threshold=-16dB:ratio=2.5:attack=10:release=100:makeup=4dB[compressed]`);
        filterComplex.push(`[compressed]alimiter=limit=0.92:attack=3:release=80[limited]`);
      }

      // === LOUDNESS NORMALIZATION ===
      // Normalize to target LUFS for consistent streaming loudness
      const finalOutput = compression ? '[limited]' : '[mixed]';
      filterComplex.push(`${finalOutput}loudnorm=I=${lufsTarget}:TP=-1.5:LRA=11[normalized]`);

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
            quality: 'billboard-ready',
            processing: {
              vocalVolume,
              beatVolume,
              autoDuck,
              compression,
              lufsTarget
            }
          });
        })
        .on('error', (err) => {
          if (logger) logger.error('Mixing error', { error: err.message });

          // Cleanup on error
          try {
            if (fs.existsSync(outputPath)) {
              fs.unlinkSync(outputPath);
            }
          } catch (_e) { /* ignore */ }

          reject(err);
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
    await Promise.all([
      downloadAudio(vocalUrl, vocalPath),
      downloadAudio(beatUrl, beatPath)
    ]);

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

module.exports = {
  mixAudioProfessional,
  mixAudioFromUrls,
  getMixPreset,
  downloadAudio
};
