// Reuse the same musical palette for standalone beats and complete song performances.
const LATIN_PROFILES = Object.freeze({
  salsa: {
    instrumental: 'clave-led salsa groove, piano montuno, tumbao bass, interlocking congas, bongos and timbales, bright brass responses, clear verse-to-montuno development',
    vocal: 'melodic lead singing with expressive phrasing, sung coro-and-pregon call and response, backing harmonies answering the lead in the same key and groove',
  },
  bachata: {
    instrumental: 'Dominican bachata arrangement, melodic requinto guitar fills, syncopated rhythm guitar, warm bass, bongos and guira, intimate verses and a lifting chorus',
    vocal: 'expressive melodic lead singing with sustained notes, tasteful harmonies and phrasing that follows the guitar and bachata rhythm',
  },
  dembow: {
    instrumental: 'Dominican dembow groove, tightly syncopated kick and snare, crisp percussion, deep controlled bass, short motifs and dynamic breaks; keep a distinct dembow identity rather than generic reggaeton',
    vocal: 'percussive rhythmic vocals locked to the dembow pattern, catchy original chants and call-and-response hooks, intentional pitched hooks where appropriate, never flat spoken narration',
  },
});

function latinGenreProfile(genre) {
  const value = String(genre || '').trim().toLowerCase();
  const id = value === 'batchata' ? 'bachata' : value === 'dembo' ? 'dembow' : value;
  return LATIN_PROFILES[id] || null;
}

module.exports = { LATIN_PROFILES, latinGenreProfile };
