// New-clone uploads are independent of saved voices. Provider inventory is
// availability evidence, never a generation-quality or likeness guarantee.
export function personalVoiceReadiness({ voiceId, voices = [], status, ownerUid, currentUid }) {
  if (!voiceId) return { state: 'none', available: false, label: 'No personal voice selected', detail: 'Create a voice with your recordings and explicit permission, or choose a studio voice.' };
  if (!currentUid || ownerUid !== currentUid || status === 'checking' || status === 'idle') {
    return { state: 'checking', available: false, label: 'Personal voice not yet verified', detail: 'Check the saved voice for this signed-in account before generating.' };
  }
  if (status !== 'loaded') return { state: 'unavailable', available: false, label: 'Voice provider unavailable', detail: 'We could not verify your saved voice. Retry the check; your profile and samples are unchanged.' };
  const voice = voices.find((item) => item.voice_id === voiceId);
  if (!voice?.studioPersonalVoice?.owned) return { state: 'missing', available: false, label: 'Saved voice unavailable', detail: 'This saved voice is no longer available. Recheck your library or explicitly choose a studio voice; your selection and recordings are unchanged.' };
  if (!voice.studioPersonalVoice.consentConfirmed) return { state: 'consent', available: false, label: 'Voice consent not verified', detail: 'This saved voice has no confirmed ownership record. It cannot be used until a consented personal voice is activated.' };
  return { state: 'available', available: true, label: 'Personal voice available', detail: 'Saved voice and recorded consent verified. No new samples are needed to reuse it; generation quality still needs an audition.' };
}

export function resolvePersonalVoiceSelection({ voiceSource, voiceStyle, readiness }) {
  const personalSelected = voiceSource === 'personal' || voiceStyle === 'cloned';
  if (!personalSelected || readiness?.available) {
    return { voiceSource, voiceStyle, recovered: false, blocked: false };
  }
  return { voiceSource, voiceStyle, recovered: false, blocked: true };
}

export function singingVoiceReadiness({ referenceId, references = [], status, ownerUid, currentUid }) {
  if (!referenceId) return { state: 'none', available: false, label: 'Prepare your singing reference', detail: 'Choose a recording, approve its vocal audition, then select it here. No ElevenLabs speech clone is required.' };
  if (!currentUid || ownerUid !== currentUid || status !== 'loaded') return { state: 'checking', available: false, label: 'Singing reference not verified', detail: 'Open Voice & optional references to verify this account’s library.' };
  const reference = references.find(item => item.id === referenceId);
  if (reference?.ownerUid !== currentUid || reference?.status !== 'ready' || reference?.review?.approved !== true) return { state: 'missing', available: false, label: 'Singing reference needs review', detail: 'Select and approve a singing reference from this account. We will not substitute another voice.' };
  return { state: 'available', available: true, label: 'Singing reference ready for audition', detail: 'Prepared and approved by you. Voice likeness, rhythm and separation quality still require listening to the generated audition.' };
}

export function personalVoiceCloneLabel({ isCloning, voiceId }) {
  return isCloning ? 'Creating your voice...' : voiceId ? 'Create a New Personal Voice' : 'Create My Voice';
}
