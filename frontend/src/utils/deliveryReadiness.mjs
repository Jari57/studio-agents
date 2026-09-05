import { restoreProjectOutputs } from './projectRestore.mjs';
import { restoreProductionConfig } from './productionProjectConfig.mjs';

export function deliveryReadiness(outputs = {}, media = {}, selectedAgents = {}, includeVocals = false) {
  const selected = ['lyrics', 'audio', 'visual', 'video'].filter(key => selectedAgents[key]);
  if (includeVocals && selectedAgents.lyrics) selected.push('vocals');
  if (includeVocals && selectedAgents.lyrics && selectedAgents.audio) selected.push('master');
  const ready = { lyrics: Boolean(outputs.lyrics?.trim()), audio: Boolean(media.audio), visual: Boolean(media.image), video: Boolean(media.video),
    vocals: Boolean(media.vocals || media.lyricsVocal), master: Boolean(media.mixedAudio) };
  const completed = selected.filter(key => ready[key]).length;
  return { selected, ready, completed, complete: selected.length > 0 && completed === selected.length };
}

export function projectDeliveryReadiness(project = {}) {
  project = project || {};
  const { media, outputs } = restoreProjectOutputs(project);
  const config = restoreProductionConfig(project);
  return deliveryReadiness(outputs, media, config.selectedAgents, !config.quickMode || config.quickOutcome !== 'song-draft');
}
