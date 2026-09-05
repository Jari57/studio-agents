// Treat identity-bearing inputs as personal even when an old/malicious client
// sends isPersonalVoice:false. A curated provider voice ID alone is not a clone.
function requestsPersonalVoice(body = {}) {
  return body.isPersonalVoice === true || body.style === 'cloned' || Boolean(body.speakerUrl) || Boolean(body.personalReferenceId);
}

module.exports = { requestsPersonalVoice };
