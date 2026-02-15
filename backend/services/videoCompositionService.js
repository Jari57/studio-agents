/**
 * Video Composition Service
 * Handles video generation, stitching, and beat synchronization
 * Supports generating multiple video segments and composing them together
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Use ffmpeg-static as fallback when system ffmpeg is not on PATH
try {
  const ffmpegStatic = require('ffmpeg-static');
  if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
  }
} catch (_e) {
  // ffmpeg-static not installed — rely on system ffmpeg
}

/**
 * Download file from URL
 */
function downloadFile(url, destPath) {
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
 * Generate multiple video segments and compose them into final video
 * Optionally syncs scene cuts to beat markers
 */
async function composeVideoWithBeats(
  videoSegments, // Array of { url, duration, beatMarkers? }
  audioPath, // Path to final audio file
  outputPath, // Output video file path
  beatMarkers, // Beat timestamps (ms) for sync points
  logger
) {
  return new Promise((resolve, reject) => {
    try {
      if (!videoSegments || videoSegments.length === 0) {
        reject(new Error('No video segments provided'));
        return;
      }

      if (logger) logger.info('Starting video composition', {
        segments: videoSegments.length,
        hasAudio: !!audioPath,
        hasBeats: beatMarkers?.length || 0
      });

      // Create concat demux file for ffmpeg
      const tempDir = path.dirname(outputPath);
      const concatFile = path.join(tempDir, `concat_${Date.now()}.txt`);
      
      let concatContent = '';
      videoSegments.forEach(segment => {
        concatContent += `file '${segment.path}'\n`;
        concatContent += `duration ${segment.duration || 5}\n`;
      });

      fs.writeFileSync(concatFile, concatContent);

      if (logger) logger.info('Concat file created', { 
        file: concatFile,
        content: concatContent.split('\n').length 
      });

      // Build ffmpeg command
      let cmd = ffmpeg(concatFile)
        .inputOptions(['-f concat', '-safe 0', '-protocol_whitelist file,http,https,tcp,tls'])
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 192k',
          '-movflags +faststart'
        ]);

      // Add audio if provided
      if (audioPath) {
        cmd = cmd.input(audioPath)
          .outputOptions([
            '-shortest', // End when shorter stream ends
            '-map 0:v:0', // Map video from first input
            '-map 1:a:0'  // Map audio from second input
          ]);
      }

      cmd = cmd.output(outputPath)
        .on('start', (cmdLine) => {
          if (logger) logger.info('FFmpeg composition started', { command: cmdLine });
        })
        .on('progress', (progress) => {
          if (logger) logger.debug('Composition progress', {
            frames: progress.currentFps,
            currentTime: progress.timemark
          });
        })
        .on('end', () => {
          if (logger) logger.info('Composition complete', { output: outputPath });
          
          // Cleanup
          try {
            fs.unlinkSync(concatFile);
          } catch (_e) { /* ignore */ }
          
          resolve({ success: true, outputPath });
        })
        .on('error', (err) => {
          if (logger) logger.error('Composition error', { error: err.message });
          
          // Cleanup
          try {
            fs.unlinkSync(concatFile);
            fs.unlinkSync(outputPath);
          } catch (_e) { /* ignore */ }
          
          reject(err);
        });

      cmd.run();
    } catch (error) {
      if (logger) logger.error('Video composition setup error', { error: error.message });
      reject(error);
    }
  });
}

/**
 * Add synchronized cuts/transitions at beat markers
 * Creates keyframe markers for beat-synced scene changes
 */
async function createBeatSyncedVideo(
  baseVideoPath,
  audioPath,
  beatMarkers, // Array of beat timestamps in ms
  outputPath,
  logger
) {
  return new Promise((resolve, reject) => {
    try {
      if (logger) logger.info('Creating beat-synced video', {
        video: baseVideoPath,
        beats: beatMarkers.length,
        output: outputPath
      });

      // Build complex filter for beat-synced transitions
      let filterComplex = '';
      
      // If we have beat markers, create transitions at beat points
      if (beatMarkers && beatMarkers.length > 0) {
        // limit to first 40 beats to avoid too long command lines
        const activeBeats = beatMarkers.slice(0, 40);
        
        const enableExpr = activeBeats.map(beat => {
          const t = (beat / 1000).toFixed(3);
          return `between(t,${t},${(parseFloat(t)+0.1).toFixed(3)})`;
        }).join('+');

        // Apply brightness flash and contrast boost on beats
        filterComplex = `eq=brightness='if(${enableExpr},0.12,0)':contrast='if(${enableExpr},1.25,1)'`;
        
        if (logger) logger.info('Generated beat-sync filter', { beatCount: activeBeats.length });
      }

      // If no beat-specific filter, use standard quality settings
      if (!filterComplex) {
        filterComplex = 'scale=1280:-1'; // Ensure consistent resolution
      }

      let cmd = ffmpeg(baseVideoPath)
        .audioCodec('aac')
        .videoCodec('libx264')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart',
          `-vf ${filterComplex}` // Apply filters
        ]);

      // Add audio
      if (audioPath) {
        cmd = cmd.input(audioPath)
          .outputOptions([
            '-map 0:v:0',
            '-map 1:a:0',
            '-shortest'
          ]);
      }

      cmd = cmd.output(outputPath)
        .on('start', (cmdLine) => {
          if (logger) logger.info('Beat sync started', { cmdLine });
        })
        .on('end', () => {
          if (logger) logger.info('Beat-synced video created', { output: outputPath });
          resolve({ success: true, outputPath, beatCount: beatMarkers.length });
        })
        .on('error', (err) => {
          if (logger) logger.error('Beat sync error', { error: err.message });
          reject(err);
        });

      cmd.run();
    } catch (error) {
      if (logger) logger.error('Beat sync setup error', { error: error.message });
      reject(error);
    }
  });
}

/**
 * Ensure video has correct format and codec
 * Converts/normalizes video to compatible format
 */
async function normalizeVideo(inputPath, outputPath, logger) {
  return new Promise((resolve, reject) => {
    try {
      if (logger) logger.info('Normalizing video format', { input: inputPath });

      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 192k',
          '-movflags +faststart'
        ])
        .output(outputPath)
        .on('end', () => {
          if (logger) logger.info('Video normalized', { output: outputPath });
          resolve({ success: true, outputPath });
        })
        .on('error', (err) => {
          if (logger) logger.error('Normalization error', { error: err.message });
          reject(err);
        })
        .run();
    } catch (error) {
      if (logger) logger.error('Normalization setup error', { error: error.message });
      reject(error);
    }
  });
}

/**
 * Get video metadata (duration, codec, resolution, etc.)
 */
async function getVideoMetadata(videoPath, logger) {
  return new Promise((resolve, reject) => {
    try {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          if (logger) logger.error('Failed to get metadata', { error: err.message });
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        const info = {
          duration: metadata.format.duration,
          bitrate: metadata.format.bit_rate,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: videoStream.r_frame_rate
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels
          } : null
        };

        if (logger) logger.debug('Video metadata retrieved', info);
        resolve(info);
      });
    } catch (error) {
      if (logger) logger.error('Metadata extraction error', { error: error.message });
      reject(error);
    }
  });
}

module.exports = {
  composeVideoWithBeats,
  createBeatSyncedVideo,
  normalizeVideo,
  getVideoMetadata,
  downloadFile
};
