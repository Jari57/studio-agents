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
  
  if (typeof audioData === 'string') {
    // Already a Blob URL - highest performance fallback
    if (audioData.startsWith('blob:')) {
      return audioData;
    }

    // Already a standard URL
    if (audioData.startsWith('http')) {
      return audioData;
    }

    // Handle Data URI and convert to Blob if it's large (base64 audio can be huge)
    // This fixes "fail to play but works in download" by avoiding huge strings in src attributes
    if (audioData.startsWith('data:')) {
      // If it's a small data URI (e.g. sample), keep it
      if (audioData.length < 100000) return audioData; 
      
      try {
        const parts = audioData.split(',');
        if (parts.length !== 2) return audioData;
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.warn('Failed to convert audio data URI to blob:', e);
        return audioData;
      }
    }
    
    // Raw base64 - add data URL prefix
    if (audioData.length > 100) {
      return formatAudioSrc(`data:audio/mpeg;base64,${audioData}`);
    }
    
    return audioData;
  }
  
  if (typeof audioData === 'object') {
    if (audioData.url) return formatAudioSrc(audioData.url);
    if (audioData.audio) return formatAudioSrc(audioData.audio);
    if (Array.isArray(audioData) && audioData[0]) {
      const first = audioData[0];
      return typeof first === 'string' ? formatAudioSrc(first) : (formatAudioSrc(first.url || first.audio || ''));
    }
  }
  
  return '';
};

export const formatVideoSrc = (videoData) => {
  if (!videoData) return '';
  
  if (typeof videoData === 'string') {
    if (videoData.startsWith('blob:') || videoData.startsWith('http')) {
      return videoData;
    }

    // Convert Video Data URIs to Blobs for playback performance
    if (videoData.startsWith('data:')) {
      try {
        const parts = videoData.split(',');
        if (parts.length !== 2) return videoData;
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.warn('Failed to convert video data URI to blob:', e);
        return videoData;
      }
    }

    return videoData;
  }
  
  if (typeof videoData === 'object') {
    if (videoData.url) return videoData.url;
    if (videoData.video) return videoData.video;
    if (Array.isArray(videoData) && videoData[0]) {
      return typeof videoData[0] === 'string' ? videoData[0] : (videoData[0].url || videoData[0].video || '');
    }
  }
  
  return '';
};
