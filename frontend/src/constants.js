import { Sparkles, Zap, Music, PlayCircle, Target, Users as UsersIcon, Rocket, Shield, Globe, Folder, Book } from 'lucide-react';

export const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.port === '5173') 
  ? 'http://localhost:3000' 
  : 'https://web-production-b5922.up.railway.app';

// AGENTS ordered for logical 2-column pairing on mobile
// Row 1: Lyrics + Beats (core music creation)
// Row 2: Visual Art + Video (visual content)  
// Row 3: Vocals + Session Players (performers)
// Row 4: Drums + Samples (rhythm production)
// Row 5: EDM Drops + Film Scoring (specialized creation)
// Row 6: Mastering + Sound Design (audio engineering)
// Row 7: Trends + Social Media (marketing)
// Row 8: Collabs + Release Planning (career growth)

// Tier Definitions:
// 'free' = Available to all users (4 agents)
// 'monthly' = Requires Monthly subscription (8 agents total)
// 'pro' = Requires Pro subscription (all 16 agents)
export const AGENTS = [
    // === ROW 1: Core Music Creation ===
    { 
      id: 'ghost', 
      name: 'Ghostwriter', 
      category: 'Music Creation', 
      icon: Sparkles, 
      colorClass: 'agent-purple', 
      tier: 'free', // FREE TIER
      description: 'AI lyricist creating bars with Udio-style structure',
      capabilities: ['Udio/Suno Structural Tags', 'Rhyme Scheme Analysis', 'Metaphor Generator', 'Flow Mapping'],
      examples: ['[Intro] [Verse 1] [Chorus]: Write a summer pop anthem', 'Create a 16-bar verse about Brooklyn in the style of 90s boom bap'],
      howToUse: 'Enter your topic and mood. Use Suno-style tags like [Bridge] or [Outro] to define the flow. The AI understands structural context for a professional songwriting experience.',
      explanation: 'Ghostwriter 2.0 uses a Large Language Model fine-tuned on professional song structures. It recognizes structural markers and translates your prompt into rhythmic, era-accurate bars.',
      helpTips: 'Pro Tip: Use structural tags (e.g., [Drop], [Hook]) to guide the AI. Combine with Music GPT for a full end-to-end production.',
      onboarding: [
        "Select a genre and mood to set the creative direction and vocabulary set.",
        "Provide a 'Seed Phrase' or topic for the AI to expand upon into full verses.",
        "Use the 'Refine' button to iterate on specific lines, adjusting for rhyme density and metaphor complexity.",
        "Export your lyrics with a 'Flow Map' that suggests rhythmic placement for each syllable."
      ],
      howTo: 'Enter a topic, mood, and style. The AI will generate lyrics.',
      example: 'Topic: "Summer Love", Mood: "Upbeat"',
      getStarted: 'Write Lyrics'
    },
    { 
      id: 'beat', 
      name: 'Music GPT', 
      category: 'Pro Producer', 
      icon: Zap, 
      colorClass: 'agent-cyan', 
      tier: 'free', // FREE TIER
      description: 'The world\'s most powerful AI music engine (Enhanced MusicGen)',
      capabilities: ['High-Fidelity Audio', 'Riffusion Spectrogram Forks', 'Seed-Persistent DNA', 'Udio-Style Musicality'],
      examples: ['[Seed: 442152] Create a high-musicality synthwave track', 'Generate an epic cinematic loop with Riffusion spectrogram logic'],
      howToUse: 'Music GPT is the core studio engine. Use "Seed Persistence" to lock in sounds for consistent Forks. Enable "High Musicality" for Udio-grade instrumentation and detail.',
      explanation: 'Music GPT 2.5 integrates Meta\'s MusicGen Large with Riffusion-style seed control. This allows for deterministic generation, meaning you can Fork a community track and maintain its exact sonic quality while tweaking the prompt.',
      helpTips: 'Pro Tip: Note down your Seeds! A Seed locks the AI\'s "imagination," allowing you to generate stems (Drums Only, Melodies) that fit perfectly with your main track.',
      onboarding: [
        "Use 'Seed Control' to maintain sonic consistency across multi-track sessions.",
        "Enable 'High Musicality' to inject nuanced production tags into the generator.",
        "Fork community tracks from the Discover Feed to explore their unique spectrogram DNA.",
        "Export individual stems for a full DAW-style mixing experience."
      ],
      howTo: 'Define mood, structure, and seed. Perfect for DAW-ready production.',
      example: 'Mood: "Epic", Seed: "888123"',
      getStarted: 'AI Studio'
    },
    // === ROW 2: Visual Content ===
    { 
      id: 'album', 
      name: 'Album Artist 2.0', 
      category: 'Visual Identity', 
      icon: Music, 
      colorClass: 'agent-orange', 
      tier: 'free', // FREE TIER
      description: 'Vibe-aligned artwork with Riffusion-style color mapping',
      capabilities: ['Style Extraction', 'Riffusion Vibe Mapping', 'Seed-Sync Visuals', 'Social Branding Kits'],
      examples: ['Create a cover that matches the "Luminous" mood of my beat', 'Generate a visual DNA profile based on the music seed'],
      howToUse: 'Art is synced to your sound. Use "Style Extraction" to upload an image you love, and the AI will blend its aesthetics with your music\'s unique Seed DNA.',
      explanation: 'Album Artist 2.0 uses Riffusion-style "Audio-to-Visual" mapping. It analyzes the frequency spectrum and BPM of your track to suggest color palettes and textures that feel sonically accurate to the music.',
      helpTips: 'Pro Tip: If you use a fixed Seed in Music GPT, use the same Seed here! This ensures the visual patterns emerge from the same "Mathematical DNA" as your sound.',
      onboarding: [
        "Select your music track to auto-extract a vibe-based color palette.",
        "Input a style reference or 'Visual Seed' to define the aesthetic grid.",
        "Generate 4 variations and 'Fork' the one that matches your brand's energy.",
        "Export the 'Social Kit' including animated canvas versions for Spotify."
      ],
      howTo: 'Describe your concept or sync to audio seed. AI generates cover art.',
      example: 'Mood: "Ethereal", Seed: "88212"',
      getStarted: 'Design Art'
    },
    { 
      id: 'video-creator', 
      name: 'Video Creator 2.5', 
      category: 'Visual Identity', 
      icon: PlayCircle, 
      colorClass: 'agent-red', 
      tier: 'free', // FREE TIER
      isBeta: true,
      description: 'Cinematic music videos with Sora/Veo physics and beat-sync',
      capabilities: ['Frame-Perfect Beat Sync', 'Style Persistence', 'Suno-style Lyric Overlays', '4K Cinematic Renders'],
      examples: ['Sync a neon flyover to every 4th kick drum', 'Generate a lyric-reactive music video with glitch aesthetics'],
      howToUse: 'Upload your beat. The AI performs "Transient Analysis" to sync camera cuts and movement to your music peaks. Use Suno-style lyric tags for reactive overlays.',
      explanation: 'Video Creator 2.5 is a physics-aware engine. It doesn\'t just generate video; it calculates "Temporal Rhythm," ensuring that visual transitions happen exactly on the beat of your Music GPT production.',
      helpTips: 'Pro Tip: Enable "Lyric Overlays" to have the AI automatically parse your Ghostwriter lyrics and place them stylistically within the 3D environment of the video.',
      onboarding: [
        "Import your audio stems for multi-layer beat synchronization.",
        "Choose a cinematic 'DNA' template (e.g., 'Retro VHS' or 'Future Noir').",
        "Preview the 'Beat-Map' and adjust transition intensity.",
        "Render in 4K for YouTube and Vertical for TikTok/Reels."
      ],
      howTo: 'Sync video to beat or describe a scene. AI does the rest.',
      example: 'Scene: "Infinite Tunnel", Sync: "Heavy"',
      getStarted: 'Sync Video'
    },
    // === ROW 3: Performers (Vocals + Instruments) ===
    { 
      id: 'vocal-arch', 
      name: 'Vocal Architect', 
      category: 'Music Creation', 
      icon: UsersIcon, 
      tier: 'pro', // PRO TIER
      isBeta: true,
      comingSoon: false,
      colorClass: 'agent-purple', 
      isPro: true,
      description: 'AI vocal synthesis with Suno-style emotional tags',
      capabilities: ['[Emotional Tagging]', 'Udio-Style Phrasing', 'Harmony Logic', 'Tuning & Correction'],
      examples: ['[Soulful Grit] Generate a powerhouse female vocal', '[Haunting Reverb] Create a layered vocal pad'],
      howToUse: 'Input lyrics and use tags like [Raspy], [Operatic], or [Ad-lib] to define the vocal character. The AI maps emotional intensity to your delivery style.',
      explanation: 'Vocal Architect 2.0 uses "Neural Emotion Mapping" to align vocal delivery with lyrical sentiment. It recognizes Suno-style descriptors to adjust breathiness, grit, and vibrato in real-time.',
      helpTips: 'Pro Tip: Layer multiple vocal takes with different tags (e.g., [Lead] + [Harmony]) to create a thick, professional vocal stack directly in the DAW timeline.',
      onboarding: ["Input structural lyrics.", "Define emotional tags.", "Synthesize and layer."],
      howTo: 'Enter lyrics and emotion tags. The AI generates professional vocals.',
      example: 'Voice: "Indie Male", Tag: "[Soulful]"',
      getStarted: 'Vocal Design'
    },
    { 
      id: 'instrument', 
      name: 'Instrumentalist', 
      category: 'Music Creation', 
      icon: Music, 
      tier: 'pro', // PRO TIER
      colorClass: 'agent-indigo', 
      isPro: true,
      isBeta: true,
      comingSoon: true,
      description: '🚧 COMING SOON - AI-driven virtual session players',
      capabilities: ['Solo Generation', 'Rhythm Section AI', 'Style Mimicry', 'Multi-instrumental'],
      examples: ['Generate a bluesy guitar solo over an A minor backing track', 'Create a funky bassline for a disco beat'],
      howToUse: 'Select your instrument and style. The AI will generate a performance that fits your track\'s key and tempo.',
      explanation: 'Instrumentalist uses physical modeling and performance capture data to simulate real session players. It doesn\'t just play notes; it understands the nuances of "touch," "vibrato," and "swing" that make a performance feel human.',
      helpTips: 'Use the "Style Mimicry" feature to have the AI play in the style of a specific legendary musician. If the performance is too complex, use the "Intensity" slider to dial it back.',
      onboarding: ["Select your instrument.", "Choose a playing style.", "Generate and refine."],
      howTo: 'Select an instrument and style. The AI will generate a solo.',
      example: 'Instrument: "Saxophone", Style: "Jazz"',
      getStarted: 'Hire Player'
    },
    // === ROW 4: Rhythm Production (Drums + Samples) ===
    { 
      id: 'beat-arch', 
      name: 'Beat Architect', 
      category: 'Music Creation', 
      icon: Zap, 
      tier: 'pro', // PRO TIER
      colorClass: 'agent-pink', 
      isBeta: true,
      comingSoon: true,
      isPro: true,
      description: '🚧 COMING SOON - Advanced drum machine and rhythm generator',
      capabilities: ['Custom Kit Design', 'Polyrhythmic Patterns', 'Velocity Humanization', 'Stem Export'],
      examples: ['Create a complex polyrhythmic drum pattern for a techno track', 'Design a custom drum kit using industrial sounds'],
      howToUse: 'Build your kit and sequence your patterns. Use the humanization tools to add a natural feel to your beats.',
      explanation: 'Beat Architect is a generative rhythm engine that uses "Evolutionary Algorithms" to create unique patterns. It analyzes the relationship between different drum elements (kick, snare, hat) to ensure a cohesive and driving groove.',
      helpTips: 'Use the "Velocity Humanization" tool to add subtle variations to each hit, making the beat feel less "robotic." Export your stems to have full control over the mix in your DAW.',
      onboarding: ["Build your kit.", "Sequence patterns.", "Humanize and export."],
      howTo: 'Choose a kit and pattern. The AI will generate a drum loop.',
      example: 'Kit: "808", Pattern: "Complex"',
      getStarted: 'Build Drums'
    },
    { 
      id: 'sample-master', 
      name: 'Sample Master', 
      category: 'Music Creation', 
      icon: Folder, 
      tier: 'pro', // PRO TIER
      colorClass: 'agent-orange', 
      isPro: true,
      comingSoon: true,
      description: '🚧 COMING SOON - Intelligent sampling and loop manipulation',
      capabilities: ['Auto-chopping', 'Time-stretching', 'Pitch-shifting', 'Loop Discovery'],
      examples: ['Chop this soul sample into 16 pads', 'Time-stretch this loop to 120 BPM without changing pitch'],
      howToUse: 'Upload your sample and let the AI analyze it. Use the chopping and manipulation tools to create something new.',
      explanation: 'Sample Master uses "Source Separation" and "Transient Detection" to intelligently identify the best parts of a sample. It can isolate vocals, drums, or instruments from a full track, giving you unprecedented sampling freedom.',
      helpTips: 'Use the "Auto-chopping" feature to quickly find the most rhythmic slices of a sample. If you are getting artifacts during time-stretching, try the "High Fidelity" mode for a cleaner sound.',
      onboarding: ["Upload sample.", "Analyze and chop.", "Manipulate and loop."],
      howTo: 'Upload a sample. The AI will chop and rearrange it.',
      example: 'Mode: "Chop", Style: "Boom Bap"',
      getStarted: 'Flip Sample'
    },
    // === ROW 5: Specialized Creation (EDM + Film) ===
    { 
      id: 'drop-zone', 
      name: 'Drop Zone', 
      category: 'Music Creation', 
      icon: Rocket, 
      tier: 'pro', // PRO TIER
      colorClass: 'agent-red', 
      isBeta: true,
      comingSoon: true,
      isPro: true,
      description: '🚧 COMING SOON - High-energy EDM and Trap drop generator',
      capabilities: ['Build-up Logic', 'Drop Synthesis', 'FX Layering', 'Energy Mapping'],
      examples: ['Generate a high-energy dubstep drop', 'Create a tension-filled build-up for a house track'],
      howToUse: 'Define your energy levels and style. The AI will generate a complete build-up and drop sequence.',
      explanation: 'Drop Zone is a specialized synthesis engine designed for high-impact transitions. It uses "Energy Mapping" to ensure that the tension of the build-up perfectly resolves into the power of the drop.',
      helpTips: 'Use the "FX Layering" tool to add white noise, risers, and impacts that glue the transition together. Experiment with the "Drop Synthesis" to create unique, never-before-heard lead sounds.',
      onboarding: ["Define energy.", "Generate build-up.", "Create the drop."],
      howTo: 'Select a genre and build-up length. The AI will generate a drop.',
      example: 'Genre: "Dubstep", Build: "8 bars"',
      getStarted: 'Create Drop'
    },
    { 
      id: 'score-edit', 
      name: 'Score Editor', 
      category: 'Music Creation', 
      icon: Book, 
      tier: 'pro', // PRO TIER
      colorClass: 'agent-emerald', 
      isPro: true,
      comingSoon: true,
      description: '🚧 COMING SOON - Precision scoring for film and media',
      capabilities: ['Sheet Music Export', 'Orchestral Layering', 'Tempo Mapping', 'Dynamic Marking'],
      examples: ['Score a dramatic orchestral piece for a short film', 'Export this melody as a lead sheet'],
      howToUse: 'Compose your score using the AI assistant. Export as MIDI or sheet music for live performance or further editing.',
      explanation: 'Score Editor is a notation-aware AI that understands the rules of counterpoint, harmony, and orchestration. It can take a simple melody and expand it into a full orchestral arrangement while maintaining musical logic.',
      helpTips: 'Use the "Dynamic Marking" tool to add expression and emotion to your score. If you are writing for live players, use the "Sheet Music Export" to generate professional-grade parts.',
      onboarding: ["Compose melody.", "Layer orchestration.", "Export sheet music."],
      howTo: 'Upload a video. The AI will generate a synchronized score.',
      example: 'Mood: "Suspense", Tempo: "Slow"',
      getStarted: 'Score Video'
    },
    // === ROW 6: Audio Engineering (Mastering + Sound Design) ===
    { 
      id: 'master', 
      name: 'Mastering Lab', 
      category: 'Audio Engineering', 
      icon: Shield, 
      tier: 'monthly', // MONTHLY TIER
      colorClass: 'agent-purple', 
      description: 'Stem-aware AI mastering with BandLab collaboration',
      capabilities: ['Stem-aware EQ', 'Cloud-Collaboration Review', 'Stereo Widening', 'Multi-format Export'],
      examples: ['Master stems for a transparent mix', 'Collaboratively review master chain with community creators'],
      howToUse: 'Upload your Full Mix or individual Stems. The AI uses BandLab-style cloud logic to allow for collaborative A/B testing and precision stem-level leveling.',
      explanation: 'Mastering Lab 2.0 isn\'t just a final limiter. It understands the relationship between your DAW stems (Drums, Bass, Vocals) and applies "Contextual Glue" to ensure your track sounds professional on everything from phone speakers to club systems.',
      helpTips: 'Pro Tip: Upload your Stems separately for a "Stem Master." This allows the AI to apply compression to the drums without affecting the clarity of the vocals.',
      onboarding: [
        "Upload stems (Drums, Bass, Leads, Vocals) for granular control.",
        "Select a sonic target (e.g., 'Modern Pop' or 'Club Heavy').",
        "Enable 'Collaborative Mode' to invite BandLab/Mureaka creators to review your master.",
        "Export high-fidelity WAV or MP3 files for global distribution."
      ],
      howTo: 'Upload stems or full mix. AI provides the professional finish.',
      example: 'Mode: "Stem Master", Target: "Streaming High"',
      getStarted: 'Pro Master'
    },
    // === ROW 7: Marketing (Trends + Social) ===
    { 
      id: 'trend', 
      name: 'Trend Hunter', 
      category: 'Career Growth', 
      icon: Target, 
      tier: 'monthly', // MONTHLY TIER
      colorClass: 'agent-emerald', 
      hasSocials: true,
      description: 'Discover what\'s hot right now',
      capabilities: ['Viral Sound Analysis', 'Hashtag Strategy', 'Competitor Tracking', 'Niche Discovery'],
      examples: ['What are the trending sounds on TikTok for R&B right now?', 'Find emerging micro-genres in the UK underground scene'],
      howToUse: 'Ask about specific platforms, regions, or genres to get tailored market intelligence. The AI scans real-time social data to find "Early Signal" trends.',
      explanation: 'Trend Hunter uses real-time API hooks into major social platforms and streaming services. It analyzes velocity, sentiment, and engagement patterns to predict which sounds and aesthetics are about to break through.',
      helpTips: 'Check the "Niche Discovery" section for low-competition, high-growth opportunities. Use the "Viral Trigger" analysis to see exactly which part of a song is driving its success.',
      onboarding: [
        "Define your niche or target audience (e.g., 'Hyperpop fans in Berlin').",
        "Analyze 'Viral Triggers'—specific sounds or themes currently gaining traction.",
        "Generate a 'Trend Report' with actionable steps to incorporate these elements into your next track.",
        "Set up 'Alerts' to be notified when a new sound in your genre starts to trend."
      ],
      howTo: 'Select a genre or platform. The AI will analyze current trends.',
      example: 'Platform: "TikTok", Genre: "Pop"',
      getStarted: 'Find Trends'
    },
    { 
      id: 'social', 
      name: 'Social Pilot', 
      category: 'Career Growth', 
      icon: Globe, 
      tier: 'monthly', // MONTHLY TIER
      colorClass: 'agent-cyan', 
      hasSocials: true,
      description: 'Automated social media growth',
      capabilities: ['Caption Generation', 'Post Scheduling', 'Engagement Automation', 'Analytics Reporting'],
      examples: ['Write 5 engaging captions for my upcoming music video teaser', 'When is the best time to post on Instagram for my audience?'],
      howToUse: 'Connect your accounts and let the AI handle the heavy lifting of content creation, hashtag optimization, and optimal posting times.',
      explanation: 'Social Pilot is a marketing automation engine that uses sentiment analysis and engagement data to craft content that resonates. It understands the specific "culture" of each platform (TikTok vs. Instagram vs. X) and adapts your voice accordingly.',
      helpTips: 'Use the "Caption Generator" to create multiple variations of a post and A/B test them to see which one performs better. Connect your Spotify account to automatically generate "New Release" alerts.',
      onboarding: [
        "Connect your social media accounts and define your 'Brand Voice'.",
        "Generate a week's worth of content (captions, hashtags, and story ideas) in seconds.",
        "Schedule posts for 'Peak Engagement' times based on your specific audience data.",
        "Review the 'Growth Report' to see which types of content are driving the most new followers."
      ],
      howTo: 'Connect your accounts. The AI will schedule and post content.',
      example: 'Goal: "Grow Instagram Followers"',
      getStarted: 'Grow Socials'
    },
    // === ROW 8: Career Growth (Collabs + Release) ===
    { 
      id: 'collab', 
      name: 'Collab Connect', 
      category: 'Career Growth', 
      icon: UsersIcon, 
      tier: 'pro', // PRO TIER
      colorClass: 'agent-indigo', 
      hasSocials: true,
      comingSoon: true,
      description: '🚧 COMING SOON - Find the perfect collaborators',
      capabilities: ['Artist Matching', 'Producer Outreach', 'Session Musician Search', 'Contract Templates'],
      examples: ['Find a female vocalist with a raspy voice for a rock track', 'Connect with mixing engineers specializing in Dolby Atmos'],
      howToUse: 'Define your project needs, budget, and "Vibe Match." The AI will scan global databases and social platforms for the best creative matches.',
      explanation: 'Collab Connect uses a proprietary "Creative DNA" matching algorithm. It looks beyond just "genre" and analyzes the sonic characteristics of an artist\'s previous work to find the most compatible partners for your specific project.',
      helpTips: 'Upload a "Reference Track" that represents the sound you are going for; this significantly improves the accuracy of the artist matches. Use the "Budget" filter to find collaborators within your range.',
      onboarding: [
        "Upload a demo or snippet of your project to help the AI understand the 'Vibe'.",
        "Specify the type of collaborator you need (Vocalist, Producer, Engineer, etc.).",
        "Review the 'Match Score' for each candidate based on their previous work and style.",
        "Use the 'Contract Generator' to create a simple split-sheet or work-for-hire agreement."
      ],
      howTo: 'Describe your project. The AI will find suitable collaborators.',
      example: 'Looking for: "Female Vocalist", Genre: "R&B"',
      getStarted: 'Find Collabs'
    },
    { 
      id: 'release', 
      name: 'Release Manager', 
      category: 'Career Growth', 
      icon: Rocket, 
      tier: 'monthly', // MONTHLY TIER
      colorClass: 'agent-pink', 
      hasSocials: true,
      comingSoon: true,
      description: '🚧 COMING SOON - Strategic release planning AI',
      capabilities: ['Rollout Timelines', 'Pitching Guides', 'Budget Allocation', 'Distribution Checklist'],
      examples: ['Create a 4-week rollout plan for a debut single', 'How should I allocate a $500 marketing budget?'],
      howToUse: 'Input your release date and goals. The AI generates a day-by-day checklist, including pitching templates for Spotify Editorial and press outlets.',
      explanation: 'Release Manager is a strategic engine built on data from thousands of successful independent releases. It optimizes your timeline based on platform algorithms and industry "best practices" for maximum visibility.',
      helpTips: 'Start your rollout at least 6 weeks in advance to give the Spotify editorial team enough time to review your pitch. Use the "Pitching Guide" to avoid common mistakes in your curator messages.',
      onboarding: [
        "Input your release date and primary goal (e.g., 'Maximize Streams' or 'Build Mailing List').",
        "Generate a 'Rollout Calendar' starting 6 weeks before the release date.",
        "Use the 'Pitching Assistant' to draft personalized messages for playlist curators and blogs.",
        "Follow the 'Launch Day' checklist to ensure all links and assets are live and working."
      ],
      howTo: 'Enter your release date. The AI will create a marketing plan.',
      example: 'Release Date: "Next Friday"',
      getStarted: 'Plan Release'
    },
    // === BONUS: Video Scorer (pairs with Video Creator conceptually) ===
    { 
      id: 'video-scorer', 
      name: 'Video Scorer', 
      category: 'Visual Identity', 
      icon: PlayCircle, 
      tier: 'pro', // PRO TIER
      isBeta: true,
      colorClass: 'agent-cyan', 
      isPro: true,
      comingSoon: true,
      description: '🚧 COMING SOON - Upload video and AI generates the soundtrack',
      capabilities: ['Scene Detection', 'Emotional Mapping', 'Sync-point Logic', 'Multi-genre Scoring'],
      examples: ['Score this 30-second commercial with upbeat pop', 'Create a haunting soundscape for this horror movie clip'],
      howToUse: 'Upload your video file. The AI will analyze the scenes and generate a soundtrack that perfectly matches the visuals.',
      explanation: 'Video Scorer uses "Computer Vision" to identify key emotional beats and scene changes in your video. It then uses "Sync-point Logic" to ensure that musical transitions happen exactly when the visual action does.',
      helpTips: 'Upload a video with clear "Cuts" to help the AI identify scene changes more accurately. Use the "Emotional Mapping" tool to shift the mood of the music from "Tense" to "Triumphant" in real-time.',
      onboarding: ["Upload video.", "Analyze scenes.", "Generate score."],
      howTo: 'Upload a video clip. The AI will generate background music.',
      example: 'Style: "Lo-Fi", Length: "30s"',
      getStarted: 'Score Clip'
    }
];
