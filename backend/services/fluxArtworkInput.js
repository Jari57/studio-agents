'use strict';

// FLUX has no negative-prompt field. The existing art-direction step expresses
// exclusions through positive composition; never regex-delete a user's words.
// Reject an invalid direction instead of silently weakening the saved brief or
// purchasing another model after a prompt-contract failure.
function positiveArtworkDirection(value) {
  const direction = typeof value === 'string' ? value.trim() : '';
  const hasNegation = /\b(?:no|not|without|never|neither|nor|cannot|exclude[ds]?|excluding|avoid(?:s|ed|ing)?|absen(?:t|ce))\b|\b(?:do|does|is|are|must|should|ca|could|would|wo|was|were)n['’]t\b|\bfree\s+(?:of|from)\b|\b\w+-free\b/i.test(direction);
  if (!direction || direction.length > 3500 || hasNegation) {
    const error = new Error('Artwork direction needs a positive visual specification. Regenerate the artwork direction from your unchanged brief, then retry. No image was generated.');
    error.code = 'ARTWORK_DIRECTION_NOT_POSITIVE';
    error.statusCode = 422;
    throw error;
  }
  return direction;
}

function buildFluxArtworkInput({ prompt, positivePrompt, aspectRatio = '1:1', referenceImage }) {
  // Older callers keep their prompt unchanged. The orchestrator explicitly
  // supplies its positive direction separately from the authoritative brief.
  const providerPrompt = positivePrompt === undefined ? prompt : positiveArtworkDirection(positivePrompt);
  const supportedRatios = new Set(['1:1', '16:9', '9:16', '4:3', '3:4']);
  return {
    prompt: providerPrompt,
    aspect_ratio: supportedRatios.has(aspectRatio) ? aspectRatio : '1:1',
    output_format: 'jpg',
    output_quality: 100,
    safety_tolerance: 3,
    prompt_upsampling: false,
    // Documented Flux 1.1 Pro / Redux reference input. It guides composition;
    // it is not a guarantee of identity or pixel-perfect cloning.
    ...(referenceImage ? { image_prompt: referenceImage } : {})
  };
}

module.exports = { positiveArtworkDirection, buildFluxArtworkInput };
