// New-clone uploads are independent of saved voices. Provider inventory is
// availability evidence, never a generation-quality or likeness guarantee.
export function personalVoiceReadiness({ voiceId, voices = [], status, ownerUid, currentUid }) {
  if (!voiceId) return { state: 'none', available: false, label: 'No personal voice selected', detail: 'Create a voice with your recordings and explicit permission, or choose a studio voice.' };
  if (!currentUid || ownerUid !== currentUid || status === 'checking' || status === 'idle') {
    return { state: 'checking', available: false, label: 'Personal voice not yet verified', detail: 'Check the saved voice for this signed-in account before generating.' };
  }
  if (status !== 'loaded') return { state: 'unavailable', available: false, label: 'Voice provider unavailable', detail: 'We could not verify your saved voice. Retry the check; your profile and samples are unchanged.' };
  const voice = voices.find((item) => item.voice_id === voiceId);
  if (!voice?.studioPersonalVoice?.owned) return { state: 'missing', available: false, label: 'Saved voice unavailable', detail: 'The selected voice was not found in your private provider library. Check again or select another voice.' };
  if (!voice.studioPersonalVoice.consentConfirmed) return { state: 'consent', available: false, label: 'Voice consent not verified', detail: 'This saved voice has no confirmed ownership record. It cannot be used until a consented personal voice is activated.' };
  return { state: 'available', available: true, label: 'Personal voice available', detail: 'Saved voice and recorded consent verified. No new samples are needed to reuse it; generation quality still needs an audition.' };
}

export function personalVoiceCloneLabel({ isCloning, voiceId }) {
  return isCloning ? 'Creating your voice...' : voiceId ? 'Create a New Personal Voice' : 'Create My Voice';
}
