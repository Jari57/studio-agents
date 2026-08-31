// Only server-owned records attest to ownership and consent, not provider data.
// `professional` / `generated` describe creation methods, NOT public access.
// The shared provider account's is_owner/sharing flags cannot identify the
// current Studio user. Until separately verified against a public inventory,
// expose only documented premade stock voices or this user's owned records.
// https://elevenlabs.io/docs/api-reference/voices/search
function personalVoiceCatalog(providerVoices, ownedVoices) {
  const owned = new Map(ownedVoices.filter((voice) => typeof voice?.voiceId === 'string' && voice.voiceId.trim())
    .map((voice) => [voice.voiceId, voice]));
  return providerVoices.filter((voice) => typeof voice?.voice_id === 'string' && voice.voice_id.trim()
      && (voice.category === 'premade' || owned.has(voice.voice_id)))
    .map((voice) => {
      const record = owned.get(voice.voice_id);
      return {
        ...voice,
        studioPersonalVoice: record ? {
          owned: true,
          consentConfirmed: record.consent?.confirmed === true,
          sampleCount: Number.isInteger(record.sampleCount) ? record.sampleCount : null,
        } : null,
      };
    });
}
module.exports = { personalVoiceCatalog };
