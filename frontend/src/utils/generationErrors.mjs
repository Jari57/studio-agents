export function generationFailureMessage(status, data = {}, agentName = 'This agent') {
  const detail = [data.details, data.error, data.message].find(value => typeof value === 'string' && value.trim());
  if (status === 403 && data.isUserCreditIssue) {
    return `Insufficient credits. ${agentName} needs ${data.required || 'more'} credits.`;
  }
  if (status === 401) return data.requiresAuth
    ? data.message || "You've used your free generations. Sign in to continue."
    : 'Please log in to use AI media generation.';
  // Preserve permission/consent/model errors. HTTP 403 alone is not a balance.
  return detail || `${agentName} could not finish this generation. Please try again.`;
}

export function selectedVoiceInputs({ personalVoiceSelected, elevenLabsVoiceId, voiceSampleUrl, speakerUrl }) {
  return {
    isPersonalVoice: Boolean(personalVoiceSelected),
    elevenLabsVoiceId: personalVoiceSelected ? elevenLabsVoiceId || null : null,
    speakerUrl: personalVoiceSelected ? voiceSampleUrl || speakerUrl || null : null,
    preferredProvider: personalVoiceSelected ? 'elevenlabs-clone' : null,
  };
}
