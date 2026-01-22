/**
 * Beat Detection Service
 * Analyzes audio files to extract BPM and beat timestamps
 * Used for syncing music videos to audio beats
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Download audio file from URL to temporary location
 */
async function downloadAudio(audioUrl, tempPath) {
  return new Promise((resolve, reject) => {
    const protocol = audioUrl.startsWith('https') ? https : http;
    const file = fs.createWriteStream(tempPath);

    protocol.get(audioUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download audio: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(tempPath);
      });
    }).on('error', (err) => {
      fs.unlink(tempPath, () => {});
      reject(err);
    });
  });
}

/**
 * Simple beat detection algorithm using energy-based peak detection
 * Analyzes audio amplitude and frequency to detect beats
 * Returns: { bpm, beats: [timestamps in ms], confidence }
 */
function detectBeatMarkers(audioBuffer, sampleRate, targetDurationMs) {
  try {
    // Convert audio buffer to float array for analysis
    const float32Array = new Float32Array(audioBuffer);
    
    // Parameters for beat detection
    const FRAME_SIZE = 2048; // samples per frame
    const HOP_SIZE = 512; // samples to advance
    const ENERGY_THRESHOLD = 0.3; // threshold for peak detection (0-1)
    
    // Compute frame energies
    const frameEnergies = [];
    for (let i = 0; i < float32Array.length - FRAME_SIZE; i += HOP_SIZE) {
      let energy = 0;
      for (let j = 0; j < FRAME_SIZE; j++) {
        energy += float32Array[i + j] * float32Array[i + j];
      }
      frameEnergies.push(Math.sqrt(energy / FRAME_SIZE));
    }
    
    // Normalize energies
    const maxEnergy = Math.max(...frameEnergies);
    const minEnergy = Math.min(...frameEnergies);
    const energyRange = maxEnergy - minEnergy || 1;
    const normalizedEnergies = frameEnergies.map(e => (e - minEnergy) / energyRange);
    
    // Detect peaks (beats) in energy
    const beatFrameIndices = [];
    for (let i = 1; i < normalizedEnergies.length - 1; i++) {
      if (normalizedEnergies[i] > normalizedEnergies[i - 1] &&
          normalizedEnergies[i] > normalizedEnergies[i + 1] &&
          normalizedEnergies[i] > ENERGY_THRESHOLD) {
        beatFrameIndices.push(i);
      }
    }
    
    // Convert frame indices to timestamps (ms)
    const frameDuration = (HOP_SIZE / sampleRate) * 1000; // ms per frame
    const beatTimestamps = beatFrameIndices
      .map(idx => idx * frameDuration)
      .filter(ts => ts < targetDurationMs);
    
    // Estimate BPM from inter-beat intervals
    let bpm = 120; // default fallback
    if (beatTimestamps.length > 1) {
      const intervals = [];
      for (let i = 1; i < beatTimestamps.length; i++) {
        intervals.push(beatTimestamps[i] - beatTimestamps[i - 1]);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        bpm = Math.round(60000 / avgInterval); // convert ms interval to BPM
        // Clamp BPM to reasonable range (60-200)
        bpm = Math.max(60, Math.min(200, bpm));
      }
    }
    
    // If too few beats detected, estimate from duration
    if (beatTimestamps.length < 2) {
      const estimatedBeats = [];
      const beatIntervalMs = (60000 / bpm);
      for (let ts = beatIntervalMs; ts < targetDurationMs; ts += beatIntervalMs) {
        estimatedBeats.push(Math.round(ts));
      }
      return {
        bpm,
        beats: estimatedBeats,
        confidence: 0.3,
        source: 'estimated'
      };
    }
    
    return {
      bpm,
      beats: beatTimestamps.map(ts => Math.round(ts)),
      confidence: Math.min(1, beatTimestamps.length / (targetDurationMs / 500)), // confidence based on beat density
      source: 'detected'
    };
  } catch (error) {
    console.error('Beat detection failed:', error);
    // Return default BPM
    return {
      bpm: 120,
      beats: [],
      confidence: 0,
      source: 'error',
      error: error.message
    };
  }
}

/**
 * Parse WAV file manually to extract audio data
 * Returns audio samples as Float32Array
 */
function parseWavFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    
    // WAV file structure
    let offset = 0;
    
    // RIFF header
    const riff = buffer.toString('ascii', offset, offset + 4);
    offset += 4;
    // const riffSize = buffer.readUInt32LE(offset); // Unused
    offset += 4;
    const wave = buffer.toString('ascii', offset, offset + 4);
    offset += 4;
    
    if (riff !== 'RIFF' || wave !== 'WAVE') {
      throw new Error('Not a valid WAV file');
    }
    
    // Find fmt chunk
    let sampleRate = 44100;
    let channels = 1;
    let bitDepth = 16;
    
    while (offset < buffer.length) {
      const chunkId = buffer.toString('ascii', offset, offset + 4);
      offset += 4;
      const chunkSize = buffer.readUInt32LE(offset);
      offset += 4;
      
      if (chunkId === 'fmt ') {
        // const audioFormat = buffer.readUInt16LE(offset); // Unused
        channels = buffer.readUInt16LE(offset + 2);
        sampleRate = buffer.readUInt32LE(offset + 4);
        bitDepth = buffer.readUInt16LE(offset + 14);
        offset += chunkSize;
      } else if (chunkId === 'data') {
        // Found audio data
        const dataLength = chunkSize / (channels * bitDepth / 8);
        const audioData = new Float32Array(dataLength * channels);
        
        let sampleIndex = 0;
        for (let i = 0; i < chunkSize; i += channels * bitDepth / 8) {
          if (bitDepth === 16) {
            for (let ch = 0; ch < channels; ch++) {
              const sample = buffer.readInt16LE(offset + i + ch * 2);
              audioData[sampleIndex++] = sample / 32768;
            }
          } else if (bitDepth === 24) {
            for (let ch = 0; ch < channels; ch++) {
              const byte1 = buffer[offset + i + ch * 3];
              const byte2 = buffer[offset + i + ch * 3 + 1];
              const byte3 = buffer[offset + i + ch * 3 + 2];
              const sample = (byte3 << 16) | (byte2 << 8) | byte1;
              audioData[sampleIndex++] = sample / 8388608;
            }
          }
        }
        
        return { audioData, sampleRate, channels, bitDepth, duration: dataLength / sampleRate };
      } else {
        offset += chunkSize;
      }
    }
    
    throw new Error('No audio data found in WAV file');
  } catch (error) {
    throw new Error(`Failed to parse WAV file: ${error.message}`);
  }
}

/**
 * Extract audio features from WAV file
 * Returns: { bpm, duration, beats, channels, sampleRate }
 */
function analyzeWavFile(filePath) {
  try {
    const wavData = parseWavFile(filePath);
    
    // Convert to mono if stereo (average channels)
    let monoAudio;
    if (wavData.channels === 2) {
      monoAudio = new Float32Array(wavData.audioData.length / 2);
      for (let i = 0; i < monoAudio.length; i++) {
        monoAudio[i] = (wavData.audioData[i * 2] + wavData.audioData[i * 2 + 1]) / 2;
      }
    } else {
      monoAudio = wavData.audioData;
    }
    
    // Calculate duration in ms
    const durationMs = wavData.duration * 1000;
    
    // Detect beat markers
    const beatAnalysis = detectBeatMarkers(monoAudio, wavData.sampleRate, durationMs);
    
    return {
      bpm: beatAnalysis.bpm,
      duration: Math.round(wavData.duration * 100) / 100, // 2 decimal places
      durationMs: Math.round(durationMs),
      beats: beatAnalysis.beats,
      confidence: beatAnalysis.confidence,
      channels: wavData.channels,
      sampleRate: wavData.sampleRate,
      bitDepth: wavData.bitDepth,
      source: beatAnalysis.source
    };
  } catch (error) {
    throw new Error(`Failed to analyze WAV file: ${error.message}`);
  }
}

/**
 * Main function: Download audio and analyze beats
 * Returns beat markers and BPM for video sync
 */
async function analyzeMusicBeats(audioUrl, logger) {
  const tempDir = path.join(__dirname, '../../backend', 'temp');
  const tempAudioPath = path.join(tempDir, `audio_${Date.now()}.wav`);
  
  try {
    // Create temp directory if needed
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    if (logger) logger.info('Downloading audio for beat analysis', { url: audioUrl.substring(0, 50) });
    
    // Download audio file
    await downloadAudio(audioUrl, tempAudioPath);
    
    if (logger) logger.info('Analyzing audio for beats', { path: tempAudioPath });
    
    // Analyze the WAV file
    const analysis = analyzeWavFile(tempAudioPath);
    
    if (logger) logger.info('Beat analysis complete', { 
      bpm: analysis.bpm, 
      beats: analysis.beats.length,
      duration: analysis.duration,
      confidence: analysis.confidence
    });
    
    return analysis;
  } catch (error) {
    if (logger) logger.error('Beat analysis failed', { error: error.message });
    // Return safe defaults
    return {
      bpm: 120,
      beats: [],
      duration: 30,
      durationMs: 30000,
      confidence: 0,
      error: error.message
    };
  } finally {
    // Clean up temp file
    try {
      if (fs.existsSync(tempAudioPath)) {
        fs.unlinkSync(tempAudioPath);
      }
    } catch (_e) {
      // Ignore cleanup errors
    }
  }
}

module.exports = {
  analyzeMusicBeats,
  analyzeWavFile,
  detectBeatMarkers,
  downloadAudio,
  parseWavFile
};
