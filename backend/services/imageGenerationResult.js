'use strict';

// Validate the provider envelope before HTTP success settles a credit
// reservation. This checks a renderable reference/signature, not visual
// quality or the future availability of a remote provider URL.
function imageMimeFromBytes(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.length >= 6 && /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp' && ['avif', 'avis'].includes(bytes.subarray(8, 12).toString('ascii'))) return 'image/avif';
  return null;
}

function normalizeImageReference(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const reference = value.trim();
  if (/^https?:\/\//i.test(reference)) {
    try {
      const url = new URL(reference);
      return url.hostname && !url.username && !url.password ? url.href : null;
    } catch {
      return null;
    }
  }

  const inline = reference.match(/^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i);
  const encoded = (inline ? inline[2] : reference).replace(/\s/g, '');
  if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
  const bytes = Buffer.from(encoded, 'base64');
  const mimeType = imageMimeFromBytes(bytes);
  if (!mimeType || bytes.toString('base64') !== encoded) return null;
  if (inline && inline[1].toLowerCase() !== mimeType) return null;
  return `data:${mimeType};base64,${encoded}`;
}

function requireImageGenerationResult(payload) {
  const candidates = [
    ...(Array.isArray(payload?.output) ? payload.output : [payload?.output]),
    ...(Array.isArray(payload?.images) ? payload.images : []),
    payload?.imageData,
  ];
  const output = candidates.map(normalizeImageReference).find(Boolean);
  if (!output) {
    const error = new Error('The image provider returned no usable image. No replacement artwork was saved.');
    error.code = 'IMAGE_GENERATION_EMPTY_RESULT';
    error.statusCode = 502;
    throw error;
  }
  return { ...payload, output, images: [output] };
}

module.exports = { normalizeImageReference, requireImageGenerationResult };
