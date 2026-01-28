/**
 * Media Utilities - Robust handling of various AI-generated media formats
 * Handles: URLs, Raw Base64, Objects {url: "..."} and Arrays
 */

export const formatImageSrc = (imageData) => {
  if (!imageData) return null;
  
  // Handle object return from some APIs (e.g., Stability/DALL-E)
  if (typeof imageData === 'object') {
    if (imageData.url) return imageData.url;
    if (imageData.b64_json) return `data:image/png;base64,${imageData.b64_json}`;
    if (Array.isArray(imageData) && imageData[0]) {
      return typeof imageData[0] === 'string' ? imageData[0] : (imageData[0].url || null);
    }
    return null;
  }
  
  if (typeof imageData !== 'string') return null;

  // Already a URL or data URL
  if (imageData.startsWith('http') || imageData.startsWith('data:')) {
    return imageData;
  }
  
  // Raw base64 - add data URL prefix
  // Simplified check: if it doesn't look like a URL and is long, assume base64
  if (imageData.length > 500) {
    return `data:image/png;base64,${imageData}`;
  }
  
  return imageData;
};

export const formatAudioSrc = (audioData) => {
  if (!audioData) return '';
  
  if (typeof audioData === 'string') return audioData;
  
  if (typeof audioData === 'object') {
    if (audioData.url) return audioData.url;
    if (audioData.audio) return audioData.audio;
    if (Array.isArray(audioData) && audioData[0]) {
      return typeof audioData[0] === 'string' ? audioData[0] : (audioData[0].url || audioData[0].audio || '');
    }
  }
  
  return '';
};

export const formatVideoSrc = (videoData) => {
  if (!videoData) return '';
  
  if (typeof videoData === 'string') return videoData;
  
  if (typeof videoData === 'object') {
    if (videoData.url) return videoData.url;
    if (videoData.video) return videoData.video;
    if (Array.isArray(videoData) && videoData[0]) {
      return typeof videoData[0] === 'string' ? videoData[0] : (videoData[0].url || videoData[0].video || '');
    }
  }
  
  return '';
};
