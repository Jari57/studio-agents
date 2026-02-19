/**
 * Format Conversion Service
 * Converts audio between formats (MP3 -> WAV, etc.) using FFmpeg
 * Follows patterns from audioMixingService.js
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Wire the bundled ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegStatic);

// Quality presets for WAV conversion
const QUALITY_PRESETS = {
  standard: { codec: 'pcm_s16le', sampleRate: 44100, channels: 2 },
  cd:       { codec: 'pcm_s16le', sampleRate: 44100, channels: 2 },
  hires:    { codec: 'pcm_s24le', sampleRate: 96000, channels: 2 }
};

/**
 * Download audio from URL or data: URI to a temp file
 */
function downloadSource(url, destPath) {
  return new Promise((resolve, reject) => {
    if (url.startsWith('data:')) {
      try {
        const base64Data = url.split(',')[1];
        if (!base64Data) return reject(new Error('Invalid data URL'));
        fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
        return resolve(destPath);
      } catch (err) {
        return reject(err);
      }
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlink(destPath, () => {});
        return downloadSource(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`Download failed: HTTP ${response.statusCode}`));
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
 * Convert audio file to WAV format using FFmpeg
 */
function convertAudioToWav(inputPath, outputPath, quality = 'cd') {
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.cd;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec(preset.codec)
      .audioFrequency(preset.sampleRate)
      .audioChannels(preset.channels)
      .format('wav')
      .output(outputPath)
      .on('end', () => {
        const stats = fs.statSync(outputPath);
        resolve({ outputPath, fileSizeBytes: stats.size });
      })
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Convert audio file to MP3 format using FFmpeg
 */
function convertAudioToMp3(inputPath, outputPath, bitrate = '320k') {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate(bitrate)
      .audioFrequency(44100)
      .audioChannels(2)
      .format('mp3')
      .output(outputPath)
      .on('end', () => {
        const stats = fs.statSync(outputPath);
        resolve({ outputPath, fileSizeBytes: stats.size });
      })
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Get media file info (duration, codec, format)
 */
function getMediaInfo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      resolve({
        duration: metadata.format.duration,
        format: metadata.format.format_name,
        codec: audioStream?.codec_name,
        sampleRate: audioStream?.sample_rate,
        channels: audioStream?.channels,
        bitRate: metadata.format.bit_rate,
        size: metadata.format.size
      });
    });
  });
}

/**
 * Clean up temp files (safe - ignores missing files)
 */
function cleanupFiles(...paths) {
  for (const p of paths) {
    try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {}
  }
}

/**
 * Ensure temp directory exists
 */
function ensureTempDir() {
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

module.exports = {
  downloadSource,
  convertAudioToWav,
  convertAudioToMp3,
  getMediaInfo,
  cleanupFiles,
  ensureTempDir,
  QUALITY_PRESETS
};
