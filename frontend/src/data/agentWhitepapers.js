// Comprehensive Agent Whitepaper Data — shared between LandingPage, WhitepapersPage, and About Us
export const AGENT_WHITEPAPER = {
  'ghost': {
    fullName: 'Ghostwriter AI',
    version: '3.2.1',
    releaseDate: 'October 2024',
    tagline: 'Your AI Co-Writer for Every Genre',
    overview: 'Ghostwriter is a structured lyric-drafting workflow backed by the configured language-model provider. It helps organize verses, hooks, bridges, rhyme direction, and revisions; the artist remains responsible for originality and the final writing.',
    problemSolved: 'Ghostwriter gives artists a structured starting point when a blank page or revision loop slows the writing process. It supports—not replaces—human writing and editing.',
    technicalStack: ['Configured language-model provider', 'Structured prompting', 'Project context', 'Draft revision workflow'],
    keyFeatures: [
      { name: 'Genre Direction', desc: 'Accepts genre and mood direction as part of the writing brief' },
      { name: 'Flow Mapping', desc: 'Visualizes syllable placement for precise rhythmic delivery' },
      { name: 'Reference Direction', desc: 'Uses high-level creative references without claiming artist impersonation' },
      { name: 'Rhyme Density Control', desc: 'Adjust from simple AABB to complex internal rhyme schemes' },
      { name: 'Metaphor Generator', desc: 'Creates unique, non-cliché metaphors based on your theme' }
    ],
    whenToUse: [
      'You have a melody but no words',
      'You\'re stuck on a specific verse or bridge',
      'You need 10 hook options in 10 minutes',
      'You want to explore a genre you\'re unfamiliar with',
      'You need lyrics for a client project on a deadline'
    ],
    whenNotToUse: [
      'You need lyrics for commercial sync (check licensing)',
      'You want 100% human-written for purist projects',
      'The song requires highly personal autobiographical content'
    ],
    workflowIntegration: 'Inject Ghostwriter at the ideation phase. Use it to generate 5-10 concept directions, then refine your favorite with iterative prompts. Export the final lyrics with Flow Map to your DAW for recording.',
    examplePrompts: [
      '"Write a 16-bar verse about losing a friend to success, in the style of 90s East Coast hip-hop. Use internal rhymes and vivid street imagery."',
      '"Create 5 hook options for a summer pop anthem about first love. Keep it radio-friendly and catchy."',
      '"Generate a melancholic bridge about missed opportunities for an indie folk song. Use nature metaphors."'
    ],
    outputFormats: ['Plain Text', 'Flow Map (PDF)', 'Teleprompter Mode', 'DAW Marker Export'],
    limitations: ['Cannot generate audio/vocals', 'May occasionally produce clichés (use Refine)', 'Reference Artist mode is stylistic, not impersonation'],
    pricing: 'Included in all paid plans. Free tier: 10 generations/month.',
    successMetrics: 'Beta measurement pending | Satisfaction and completion metrics will be reported from real customer usage'
  },
  'beat': {
    fullName: 'Beat Lab Pro',
    version: '2.8.0',
    releaseDate: 'November 2024',
    tagline: 'Production Ideas at the Speed of Thought',
    overview: 'Beat Lab helps turn tempo, key, genre, and instrumentation choices into a production brief and musical starting points.',
    problemSolved: 'Beat Lab speeds up early ideation by organizing rhythm, chord, and arrangement directions for the producer to review.',
    technicalStack: ['Structured music prompts', 'Project tempo and key context', 'Provider routing', 'Saved version workflow'],
    keyFeatures: [
      { name: 'Genre Direction', desc: 'Adds genre-specific direction without guaranteeing a result' },
      { name: 'Chord Progression Logic', desc: 'Follows harmonic rules while allowing creative tension' },
      { name: 'Sample Sourcing', desc: 'Suggests royalty-free samples that match your vibe' },
      { name: 'MIDI Export', desc: 'Drag patterns directly into any DAW' },
      { name: 'Variation Engine', desc: 'Auto-generates B-sections and fills' }
    ],
    whenToUse: [
      'Starting a new beat from scratch',
      'You need a chord progression that "works"',
      'You want drum pattern inspiration',
      'You\'re producing in an unfamiliar genre',
      'You need 20 beat ideas for a sample pack'
    ],
    whenNotToUse: [
      'You need a fully mixed beat (use full DAW)',
      'You want to play everything live',
      'You need audio stems (use Beat Architect)'
    ],
    workflowIntegration: 'Use Beat Lab at project start. Generate a foundation (drums + chords), export MIDI, then build your arrangement in your DAW. Return to Beat Lab for variations.',
    examplePrompts: [
      '"Generate a dark trap drum pattern at 140 BPM with minimal hi-hat rolls"',
      '"Suggest a jazz-infused chord progression in F minor for a lo-fi beat"',
      '"Create a reggaeton drum pattern with a modern dembow rhythm"'
    ],
    outputFormats: ['MIDI Files', 'Pattern Preview (Audio)', 'Sample Pack Links', 'Theory Analysis PDF'],
    limitations: ['Patterns are MIDI only (no audio)', 'Complex polyrhythms may need manual editing', 'Sample suggestions are external links'],
    pricing: 'Included in all paid plans. Free tier: 5 patterns/month.',
    successMetrics: 'Beta measurement pending | Export and completion metrics are not yet established'
  },
  'album': {
    fullName: 'Album Artist AI',
    version: '4.0.0',
    releaseDate: 'December 2024',
    tagline: 'Your Visual Identity, Perfected',
    overview: 'Album Artist turns a release brief, mood, palette, and permitted references into an image-provider request. Outputs are creative drafts, not automatically print- or release-ready assets.',
    problemSolved: 'Album Artist gives creators fast visual starting points and variations. Every output still requires review for typography, likeness, rights, and release suitability.',
    technicalStack: ['Imagen 3 (Google)', 'Resolution Upscaler', 'Platform Optimizer', 'Typography Engine', 'Color Palette Extractor'],
    keyFeatures: [
      { name: 'Multi-Style Generation', desc: 'From photorealistic to abstract, anime to oil painting' },
      { name: 'Platform Preparation', desc: 'Helps prepare selected images for common platform dimensions' },
      { name: 'Typography Integration', desc: 'Add artist name and title with curated fonts' },
      { name: 'Brand Palette', desc: 'Extract and apply consistent colors across all assets' },
      { name: 'Export Review', desc: 'Prompts the user to verify resolution, typography, and rights before printing' }
    ],
    whenToUse: [
      'You need cover art for a new release',
      'You want a consistent visual brand',
      'You need social media graphics fast',
      'You\'re designing merch',
      'You want to visualize your album concept'
    ],
    whenNotToUse: [
      'You need photography of yourself (use a photographer)',
      'You want hand-drawn illustration style (commission an artist)',
      'Legal requires specific image licensing'
    ],
    workflowIntegration: 'Generate art after your music is mixed. Use the "Mood" from your track as the prompt foundation. Export Social Kit before release day.',
    examplePrompts: [
      '"A cyberpunk cityscape at night, neon purple and cyan, cinematic lighting, for a synthwave album"',
      '"Minimalist abstract shapes in warm earth tones for an indie folk EP, modern and clean"',
      '"Dark surrealist portrait with glitch effects for a trap single, high contrast"'
    ],
    outputFormats: ['3000x3000 Cover (Spotify/Apple)', 'Social Kit (IG, YT, TikTok)', 'Print-Ready (300 DPI)', 'Brand Board PDF'],
    limitations: ['Cannot generate real human faces (AI policy)', 'Text rendering may need refinement', 'Complex logos should be vector (use external)'],
    pricing: 'Included in all paid plans. Free tier: 3 covers/month.',
    successMetrics: 'Beta measurement pending | Distribution acceptance is not certified by Studio Agents'
  },
  'video-creator': {
    fullName: 'Video Creator (Veo 3)',
    version: '1.5.0 BETA',
    releaseDate: 'December 2024',
    tagline: 'Cinematic AI Video for Music',
    overview: 'Video Creator sends scene direction to the configured video provider and tracks the resulting operation. Availability, duration, resolution, and consistency depend on the provider.',
    problemSolved: 'Video Creator helps artists prototype scenes and visual directions before assembling and finishing them in a video editor.',
    technicalStack: ['Configured video provider', 'Asynchronous operation tracking', 'Private result proxy', 'Retry and failure states'],
    keyFeatures: [
      { name: 'Scene Generation', desc: 'Create any scene from text description' },
      { name: 'Music Reference', desc: 'Attach project audio as creative context when the provider supports it' },
      { name: 'Style Transfer', desc: 'Apply cinematic looks (Film Noir, Anime, etc.)' },
      { name: 'Camera Control', desc: 'Specify drone shots, close-ups, tracking' },
      { name: 'Loop Direction', desc: 'Requests loop-friendly motion; seamless output is not guaranteed' }
    ],
    whenToUse: [
      'You need a music video but have no budget',
      'You want visualizers for streaming platforms',
      'You need social content (TikTok, Reels)',
      'You\'re creating a visual album',
      'You want to pitch a video concept to a director'
    ],
    whenNotToUse: [
      'You need footage of yourself (film it)',
      'You require broadcast-quality output (use post-production)',
      'Complex narrative with dialogue'
    ],
    workflowIntegration: 'Use after music is mastered. Upload audio, describe scenes for each section, generate clips, then edit together in your video editor.',
    examplePrompts: [
      '"A slow-motion shot of rain falling on a city street at night, neon reflections, cinematic, melancholic"',
      '"Drone shot flying over a desert at golden hour, vast and empty, epic scale"',
      '"Abstract liquid metal morphing in sync with bass drops, chrome and purple"'
    ],
    outputFormats: ['1080p MP4', '4K MP4 (Pro)', 'Loop GIF', 'Vertical (9:16)'],
    limitations: ['BETA - occasional artifacts', 'Max 30 seconds per generation', 'Human faces may be inconsistent'],
    pricing: 'Pro plan only during beta. 5 videos/month included.',
    successMetrics: 'Beta measurement pending | Provider success and user satisfaction are shown only when real telemetry exists'
  },
  'master': {
    fullName: 'Mastering Lab AI',
    version: '3.5.0',
    releaseDate: 'September 2024',
    tagline: 'Automated Mastering Comparisons',
    overview: 'Mastering Lab provides an automated processing workflow for auditioning loudness and tonal changes. It is not represented as a replacement for a mastering engineer, and every output requires listening and platform checks.',
    problemSolved: 'Mastering Lab speeds up draft comparisons and export preparation. Processing time and result quality depend on the source mix and active provider.',
    technicalStack: ['Configured audio-processing provider', 'Loudness measurement', 'Preset comparison', 'Export workflow'],
    keyFeatures: [
      { name: 'Platform Presets', desc: 'Optimized for Spotify, Apple, YouTube, Vinyl' },
      { name: 'Reference Matching', desc: 'Match the sonic profile of a reference track' },
      { name: 'A/B Testing', desc: 'Compare original vs. master in real-time' },
      { name: 'Stem Mastering', desc: 'Upload stems for more control (Pro)' },
      { name: 'Multi-Format Export', desc: 'WAV, FLAC, MP3, and platform-specific' }
    ],
    whenToUse: [
      'Your mix is done and ready for release',
      'You need a quick master for pitching',
      'You\'re releasing to streaming platforms',
      'You want to compare mastering options',
      'You\'re on a budget but need quality'
    ],
    whenNotToUse: [
      'Your mix has significant issues (fix in mix)',
      'You need analog warmth (hire a mastering engineer)',
      'Major label release (consider hybrid approach)'
    ],
    workflowIntegration: 'Use as the final step before distribution. Upload your mixdown (-6dB headroom), select platform, and download your master.',
    examplePrompts: [
      '"Master for Spotify, warm and punchy, reference: Drake - God\'s Plan"',
      '"Vinyl-ready master, preserve dynamics, add analog warmth"',
      '"Loud and aggressive master for EDM, maximize impact"'
    ],
    outputFormats: ['WAV 24-bit', 'WAV 16-bit', 'FLAC', 'MP3 320kbps', 'Platform-Specific'],
    limitations: ['Cannot fix bad mixes', 'Stem mastering requires Pro plan', 'Some genres may need manual tweaking'],
    pricing: 'Included in all paid plans. Free tier: 2 masters/month.',
    successMetrics: 'Beta measurement pending | Masters require listening and platform validation before release'
  },
  'trend': {
    fullName: 'Trend Hunter AI',
    version: '2.5.0',
    releaseDate: 'November 2024',
    tagline: 'Know What\'s Next Before Everyone Else',
    overview: 'Trend Hunter monitors social media, streaming platforms, and music charts in real-time to identify emerging trends, viral sounds, and optimal release timing.',
    problemSolved: 'Artists miss trend windows by 2-4 weeks because they lack data access. Trend Hunter surfaces insights that typically cost $10K+ from music intelligence firms.',
    technicalStack: ['Social Listening AI', 'Streaming Analytics API', 'Viral Prediction Model', 'Hashtag Analyzer', 'Release Timing Engine'],
    keyFeatures: [
      { name: 'Trend Radar', desc: 'Real-time visualization of emerging sounds' },
      { name: 'Viral Prediction', desc: 'AI scores tracks for viral potential' },
      { name: 'Release Timing', desc: 'Optimal day/time for your genre' },
      { name: 'Hashtag Strategy', desc: 'Which tags are gaining momentum' },
      { name: 'Competitor Analysis', desc: 'What\'s working for similar artists' }
    ],
    whenToUse: [
      'Planning your next single',
      'Deciding when to release',
      'Creating content for TikTok',
      'Understanding your competitive landscape',
      'Pitching to playlists'
    ],
    whenNotToUse: [
      'You don\'t care about commercial success',
      'Your genre is extremely niche',
      'You prefer artistic purity over trends'
    ],
    workflowIntegration: 'Check Trend Hunter before starting a new project to align with current momentum. Return before release to optimize timing.',
    examplePrompts: [
      '"What sounds are trending in Hip-Hop on TikTok this week?"',
      '"When is the best time to release an R&B single?"',
      '"What hashtags should I use for my indie rock release?"'
    ],
    outputFormats: ['Trend Report PDF', 'Release Calendar', 'Hashtag List', 'Competitor Dashboard'],
    limitations: ['Trends change rapidly', 'Not all genres have equal data', 'Predictions are probabilistic'],
    pricing: 'Included in all paid plans. Free tier: 1 report/month.',
    successMetrics: 'Beta measurement pending | No historical prediction-accuracy claim is made'
  },
  'social': {
    fullName: 'Social Pilot AI',
    version: '2.2.0',
    releaseDate: 'October 2024',
    tagline: 'Your 24/7 Social Media Manager',
    overview: 'Social Pilot creates, schedules, and optimizes social media content across all platforms. From captions to carousels, it keeps your audience engaged without burning you out.',
    problemSolved: 'Artists spend 15+ hours/week on social media, often with inconsistent results. Social Pilot reduces this to 2 hours/week while improving engagement.',
    technicalStack: ['Multi-Platform API', 'Caption Generator', 'Optimal Timing AI', 'Engagement Predictor', 'Hashtag Optimizer'],
    keyFeatures: [
      { name: 'Caption Generator', desc: 'Platform-optimized copy in your voice' },
      { name: 'Content Calendar', desc: 'Automated scheduling across platforms' },
      { name: 'Engagement Timing', desc: 'Post when your audience is active' },
      { name: 'Carousel Creator', desc: 'Multi-image posts for Instagram' },
      { name: 'Analytics Dashboard', desc: 'Track performance across platforms' }
    ],
    whenToUse: [
      'You need consistent social presence',
      'You\'re launching a new release',
      'You want to grow your following',
      'You\'re tired of writing captions',
      'You need a content strategy'
    ],
    whenNotToUse: [
      'You prefer spontaneous posting',
      'Your content is highly personal/reactive',
      'You have a dedicated social media team'
    ],
    workflowIntegration: 'Set up your release campaign in Social Pilot. Generate a month of content, schedule it, and monitor analytics.',
    examplePrompts: [
      '"Write 10 Instagram captions for my new single release"',
      '"Create a TikTok content strategy for the next month"',
      '"What are the best posting times for my R&B audience?"'
    ],
    outputFormats: ['Caption Library', 'Content Calendar', 'Carousel Templates', 'Analytics Report'],
    limitations: ['Cannot post automatically (requires approval)', 'TikTok video creation is separate', 'Engagement varies by account'],
    pricing: 'Included in all paid plans. Free tier: 5 posts/month.',
    successMetrics: 'Beta measurement pending | Engagement lift is not guaranteed or historically established'
  },
  'collab': {
    fullName: 'Collab Connect AI',
    version: '1.8.0',
    releaseDate: 'November 2024',
    tagline: 'Find Your Perfect Creative Partner',
    overview: 'Collab Connect matches you with collaborators based on your sound, style, and goals. From producers to vocalists to engineers, find your next creative partner.',
    problemSolved: 'Finding the right collaborator takes weeks of networking and often results in mismatched creative visions. Collab Connect surfaces compatible artists instantly.',
    technicalStack: ['Artist Matching Algorithm', 'Sound Analysis AI', 'Goal Alignment Engine', 'Portfolio Analyzer', 'Communication Hub'],
    keyFeatures: [
      { name: 'Sound Matching', desc: 'Find artists whose style complements yours' },
      { name: 'Goal Alignment', desc: 'Match based on career objectives' },
      { name: 'Portfolio Review', desc: 'Preview their work before connecting' },
      { name: 'In-App Messaging', desc: 'Communicate without sharing personal info' },
      { name: 'Collab Contracts', desc: 'Built-in split sheet templates' }
    ],
    whenToUse: [
      'You need a feature artist',
      'You want a producer for your project',
      'You need a mixing/mastering engineer',
      'You want to expand your network',
      'You\'re looking for songwriting partners'
    ],
    whenNotToUse: [
      'You prefer working alone',
      'You have an established network',
      'You need a specific named artist'
    ],
    workflowIntegration: 'Upload your work to create your profile. Browse matches, connect, and use built-in tools to manage the collaboration.',
    examplePrompts: [
      '"Find producers who make dark trap beats in Atlanta"',
      '"Match me with female vocalists for R&B features"',
      '"Show me mixing engineers who specialize in Hip-Hop"'
    ],
    outputFormats: ['Match List', 'Artist Profiles', 'Split Sheet Template', 'Collaboration Dashboard'],
    limitations: ['Depends on user base in your genre/location', 'Cannot guarantee response rates', 'Quality varies by user'],
    pricing: 'Included in all paid plans. Free tier: 3 matches/month.',
    successMetrics: 'Beta measurement pending | Match and collaboration outcomes are not yet established'
  },
  'release': {
    fullName: 'Release Manager AI',
    version: '2.0.0',
    releaseDate: 'December 2024',
    tagline: 'Your Personal A&R Team',
    overview: 'Release Manager orchestrates your entire release campaign—from metadata to marketing timeline to playlist pitching. It\'s the A&R department in your pocket.',
    problemSolved: 'Independent artists miss critical release steps, resulting in poor discoverability and wasted marketing spend. Release Manager ensures nothing falls through the cracks.',
    technicalStack: ['Release Timeline Engine', 'Metadata Optimizer', 'Playlist Pitch Generator', 'Marketing Calendar AI', 'Analytics Integration'],
    keyFeatures: [
      { name: 'Release Timeline', desc: 'Countdown with daily tasks' },
      { name: 'Metadata Optimization', desc: 'Perfect your song info for discovery' },
      { name: 'Playlist Pitch', desc: 'AI-written pitches for Spotify curators' },
      { name: 'Marketing Calendar', desc: 'Coordinated social, PR, and paid' },
      { name: 'Post-Release Analysis', desc: 'Track performance vs. goals' }
    ],
    whenToUse: [
      'You\'re releasing new music',
      'You want to maximize first-week streams',
      'You need a coordinated campaign',
      'You\'re pitching to playlists',
      'You want to learn release best practices'
    ],
    whenNotToUse: [
      'You have a label handling release',
      'You\'re releasing casually (no promo)',
      'You have a dedicated manager'
    ],
    workflowIntegration: 'Start Release Manager 4-6 weeks before release. Follow the daily tasks. Use generated assets and pitches across your campaign.',
    examplePrompts: [
      '"Create a 6-week release campaign for my debut EP"',
      '"Write a Spotify playlist pitch for my new single"',
      '"What should I post the week before release?"'
    ],
    outputFormats: ['Release Timeline', 'Playlist Pitch Docs', 'Marketing Calendar', 'Post-Release Report'],
    limitations: ['Cannot submit to DSPs (use distributor)', 'Playlist placement not guaranteed', 'Requires your active participation'],
    pricing: 'Included in all paid plans. Free tier: 1 release/month.',
    successMetrics: 'Beta measurement pending | Streaming lift is not guaranteed or historically established'
  }
};

// Default whitepaper for agents without detailed data
export const DEFAULT_WHITEPAPER = {
  version: '1.0.0',
  releaseDate: 'December 2024',
  tagline: 'AI-Powered Music Creation',
  overview: 'This agent is part of Studio Agents\' comprehensive AI toolkit for music creation and career development.',
  problemSolved: 'Reduces time and cost while improving quality of music production workflows.',
  technicalStack: ['Google Gemini', 'Custom ML Models', 'Cloud Processing'],
  keyFeatures: [],
  whenToUse: ['When you need AI assistance for this task'],
  whenNotToUse: ['When manual control is required'],
  workflowIntegration: 'Integrate at the appropriate stage of your music production workflow.',
  examplePrompts: ['Describe your needs and the AI will assist'],
  outputFormats: ['Digital Export'],
  limitations: ['See agent-specific documentation'],
  pricing: 'Included in paid plans.',
  successMetrics: 'Beta measurement pending | No satisfaction benchmark is claimed yet'
};
