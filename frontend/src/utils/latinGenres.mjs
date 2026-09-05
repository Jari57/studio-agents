// Creative starting points, not fixed limits: tempo and language remain editable.
export const LATIN_SONG_GENRES = Object.freeze([
  { id: 'salsa', label: 'Salsa', bpm: 180, mood: 'Energetic', voice: 'singer', hint: 'Piano montuno, brass, layered percussion, and a sung call-and-response chorus.' },
  { id: 'bachata', label: 'Bachata', bpm: 128, mood: 'Dreamy', voice: 'singer', hint: 'Requinto guitar, bongos, güira, warm bass, and a melodic lead vocal.' },
  { id: 'dembow', label: 'Dembow', bpm: 115, mood: 'Energetic', voice: 'rapper', hint: 'Dominican dembow groove, syncopated percussion, bass, and rhythmic vocal hooks.' },
]);

export const LATIN_GENRE_PRESETS = Object.fromEntries(LATIN_SONG_GENRES.map(({ label, bpm, mood }) => [
  label, { bpm, mood, structure: 'Full Song', duration: 150 },
]));

export function detectLatinGenre(text) {
  const match = String(text || '').match(/\b(salsa|bachata|batchata|dembow|dembo)\b/i);
  if (!match) return null;
  const value = match[1].toLowerCase();
  const id = value === 'batchata' ? 'bachata' : value === 'dembo' ? 'dembow' : value;
  return LATIN_SONG_GENRES.find(genre => genre.id === id);
}
