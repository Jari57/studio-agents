// Keep orchestration decisions tied to the requested outputs, not leftover UI state.
export function productionScope(selection = {}, includeVocals = true) {
  const vocals = Boolean(includeVocals && selection.lyrics);
  return { vocals, finalMix: Boolean(vocals && selection.audio), mux: Boolean(selection.video && selection.audio) };
}

export function productionPrerequisiteError(selection = {}, retainedMedia = {}) {
  if (selection.video && !selection.audio && !retainedMedia.audio && !retainedMedia.mixedAudio) {
    return 'Music-video production needs audio. Select Beat Audio, or open a saved beat and create its video from the Video panel.';
  }
  return '';
}

export function unfinishedProductionSteps(steps = []) {
  return steps.filter(step => step.status !== 'done');
}

export function currentRunLyrics(fresh, generated, checkpoint = '', prior = '') {
  return fresh ? generated || '' : generated || checkpoint || prior || '';
}

export function mergeCurrentMedia(existing = {}, current = {}) {
  return { ...existing, ...Object.fromEntries(Object.entries(current).filter(([, value]) => value != null && value !== '')) };
}

export function artworkRequestPrompt(brief, direction, context = '') {
  return [
    'Create the requested artwork. The original brief is authoritative: preserve its palette, composition, exclusions, and requested medium. Supporting art direction must not override it. Do not add lettering, people, logos, photography, or extra scenes unless the brief requests them.',
    `ORIGINAL BRIEF:\n${String(brief || '').trim()}`,
    `SUPPORTING ART DIRECTION:\n${String(direction || '').trim().slice(0, 3500)}`,
    context ? `OPTIONAL SAME-PROJECT CONTEXT (only when compatible with the brief):\n${context}` : '',
  ].filter(Boolean).join('\n\n');
}

// The visual slot produces a single image, even when another selected slot
// produces video. Do not send music duration/style defaults to the text agent:
// the backend appends duration to the prompt and can turn art into a storyboard.
export function artworkDirectionRequest(brief, { language = 'English', model, referenceUrl = null, context = '' } = {}) {
  return {
    prompt: [
      'Develop art direction for one static artwork image from this original brief.',
      `ORIGINAL BRIEF:\n${String(brief || '').trim()}`,
      context ? `OPTIONAL SAME-PROJECT CONTEXT (use only where compatible with the original brief):\n${String(context).trim().slice(0, 800)}` : '',
    ].filter(Boolean).join('\n\n'),
    systemInstruction: [
      'You are the art director for the selected static-artwork output. Return only a concise, concrete image-generation direction (one paragraph, up to 160 words).',
      'Treat the original brief as authoritative: preserve every explicit palette, medium, composition, subject, aspect-ratio, lettering choice, and exclusion. Do not replace or embellish these constraints with generic branding advice.',
      'Write a positive-only visual specification for FLUX: describe exactly the allowed subjects, their positions, surfaces, and the background occupying the rest of the frame. Convert exclusions into concrete positive visual alternatives and empty-space descriptions. Never repeat an excluded object or forbidden noun in the returned paragraph, even to say it is absent. Avoid negation, exclusion lists, and absence claims. Preserve the intended restriction through the positive composition instead; the original brief is retained separately.',
      'Describe one still composition. Do not produce a storyboard, video concept, shot list, sequence, timestamps, animation instructions, duration, BPM, lyrics, or a soundtrack.',
      'Do not infer a music genre or impose hip-hop, photography, people, faces, logos, bold typography, or extra scenery unless the original brief asks for them.',
      'Other same-project context or references may help only where compatible with the original brief. Do not expand the requested deliverable. No preamble, marketing claims, or explanation.',
    ].join(' '),
    ...(model ? { model } : {}),
    language,
    referenceUrl,
  };
}

export async function confirmProjectSave(save, project) {
  if (typeof save !== 'function') throw new Error('No project save connection is available. Keep this page open and download your work.');
  const result = await save(project);
  if (result !== true) throw new Error('Cloud save did not complete. Your current work is still here; retry saving before closing or generating a new version.');
  return true;
}
