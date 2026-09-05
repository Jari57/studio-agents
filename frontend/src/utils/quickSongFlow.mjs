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
