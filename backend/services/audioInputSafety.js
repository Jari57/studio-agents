// A downloaded file is still untrusted. Reject playlist/concat demuxers so
// FFmpeg cannot follow URLs or local-file references embedded in its contents.
const SAFE_AUDIO_FORMATS = 'mp3,wav,flac,ogg,mov,matroska,webm,aac,aiff';
const SAFE_AUDIO_INPUT_ARGS = ['-protocol_whitelist', 'file,pipe', '-format_whitelist', SAFE_AUDIO_FORMATS];
const SAFE_AUDIO_INPUT_OPTIONS = ['-protocol_whitelist file,pipe', `-format_whitelist ${SAFE_AUDIO_FORMATS}`];
module.exports = { SAFE_AUDIO_INPUT_ARGS, SAFE_AUDIO_INPUT_OPTIONS };
