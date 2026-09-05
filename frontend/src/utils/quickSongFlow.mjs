// Quick creation describes deliverables, not a sequence the artist must manage.
export function quickProductionPlan(outcome = 'song') {
  const fullPackage = outcome === 'full-package';
  const draft = outcome === 'song-draft'; // Preserve explicitly saved legacy drafts.
  return {
    agentSelection: { lyrics: 'ghost', audio: 'beat', visual: fullPackage ? 'album' : null, video: fullPackage ? 'video-creator' : null },
    includeVocals: !draft,
    completionMessage: fullPackage ? 'Full package complete!' : draft
      ? 'Lyrics and beat draft ready. Add vocals when you choose.'
      : 'Your song is ready — listen, then save or download. Artwork and video are optional.',
  };
}

// Keep the supplied direction as a brief, not a second AI-generated dependency.
export function quickBriefPreferences(brief, languages = []) {
  const text = String(brief || '');
  const requested = languages.filter(language => {
    const name = language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      `\\b(?:sing|sung|write|written|lyrics?|vocals?|song)(?:\\s+\\w+){0,2}\\s+in\\s+${name}\\b`,
      `\\b${name}(?:[-\\s]+(?:salsa|bachata|dembow|trap|pop|rap|original|language|lead|melodic)){0,3}[-\\s]+(?:song|lyrics?|vocals?|singing)\\b`,
      `\\blanguage\\s*:\\s*${name}\\b`,
    ];
    return patterns.some(pattern => {
      const match = new RegExp(pattern, 'i').exec(text);
      return match && !/\b(?:not|no|never|avoid|without|don['’]t)\b/i.test(text.slice(Math.max(0, match.index - 12), match.index) + match[0]);
    });
  });
  // Ambiguous multilingual direction stays visible in the brief; do not guess.
  const language = requested.length === 1 ? requested[0] : null;
  const durationMatch = text.match(/\b(\d+(?:\.\d+)?|one|two|three)\s*[- ]?\s*(seconds?|secs?|minutes?|mins?)\b/i);
  const number = durationMatch ? ({ one: 1, two: 2, three: 3 }[durationMatch[1].toLowerCase()] || Number(durationMatch[1])) : null;
  const seconds = number && number * (/^m/i.test(durationMatch[2]) ? 60 : 1);
  return { language, duration: seconds >= 30 && seconds <= 300 ? Math.round(seconds) : null };
}

export function songLyricStructure(duration, structure = 'full') {
  const seconds = Number(duration) || 150;
  if (seconds <= 75) return `SHORT SONG — target approximately ${seconds} seconds: one short verse, one chorus and a brief ending. About ${Math.round(seconds * 1.3)} words maximum; leave room for musical phrasing. Do not add repeated verses or a long bridge.`;
  return `${structure === 'extended' ? 'EXTENDED' : structure === 'single' ? 'SINGLE' : 'FULL'} SONG — target approximately ${seconds} seconds. Scale verses and chorus repeats to that duration, leaving space for the instrumental. About ${Math.round(seconds * 1.5)} words maximum.`;
}

export function musicalStageLabel(status) {
  if (status === 'generating-musical-performance' || status === 'minimax-starting') return 'Creating the sung performance and its accompaniment';
  if (status === 'separating-vocal') return 'Separating matching vocal and instrumental stems';
  if (/^minimax-poll(?:ing|-\d+)$/.test(String(status))) return 'Waiting for the musical performance — your job is still running';
  return null;
}

export function songDirectionBrief({ idea, genre, bpm, language, duration }) {
  return [
    'Song direction (from your brief):', String(idea || '').trim(),
    [genre, Number(bpm) > 0 ? `${Number(bpm)} BPM` : '', language, Number(duration) > 0 ? `Target ${Number(duration)} seconds` : ''].filter(Boolean).join(' · '),
  ].filter(Boolean).join('\n');
}

export function recoveryOfferVisible(job, projectId, brief, hasStartedRun) {
  if (!job || hasStartedRun) return false;
  if ((job.projectId || null) !== (projectId || null)) return false;
  // An unassigned old run may be offered on an empty desk, but must not follow
  // an artist into a different idea. Nothing is deleted or cancelled here.
  return Boolean(projectId) || !String(brief || '').trim() || String(brief).trim() === String(job.prompt || '').trim();
}

export function quickSongJourney({ outcome, idea, lyrics, media = {} }) {
  const { includeVocals } = quickProductionPlan(outcome);
  const fullPackage = outcome === 'full-package';
  const vocal = Boolean(media.vocals || media.lyricsVocal);
  const stages = [
    { id: 'brief', label: 'Describe', complete: Boolean(String(idea || '').trim()) },
    { id: 'song', label: includeVocals ? 'Create song' : 'Create draft', complete: Boolean(lyrics && media.audio && (!includeVocals || (vocal && media.mixedAudio))) },
    ...(fullPackage ? [{ id: 'visuals', label: 'Art & video', complete: Boolean(media.image && media.video) }] : []),
  ];
  const ready = stages.every(stage => stage.complete);
  return {
    stages, ready,
    next: stages.find(stage => !stage.complete)?.id || 'review',
    message: !String(idea || '').trim() ? 'Describe your song. A sample is optional — MiniMax can create an original performance.'
      : ready ? 'Ready to listen. Save your project or download the takes you want to keep.'
        : includeVocals ? 'One creation: lyrics, a vocal performance, its matching beat, and a playable mix. No separate vocal or mix step.'
          : 'Lyrics and an instrumental draft only. Vocals, artwork, and video are not included in this choice.',
  };
}
