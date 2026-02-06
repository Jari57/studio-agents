import React, { useState } from 'react';
import { 
  Shield, ChevronRight, FileText, Tv, CreditCard,
  ArrowLeft, BookOpen, CheckCircle, AlertCircle, Scale,
  Gavel, HelpCircle, FileCheck, Info, Clock, AlertTriangle, Target
} from 'lucide-react';

const FormattedLegalContent = ({ content, accentColor }) => {
  if (!content) return null;

  const lines = content.split('\n');
  
  return (
    <div className="formatted-legal-content" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: '10px' }} />;

        // Subheaders
        if (trimmed.endsWith(':') && (trimmed.length < 60 || trimmed.includes('**'))) {
          const text = trimmed.replace(/\*\*/g, '').replace(/:$/, '');
          return (
            <h4 key={idx} style={{ 
              fontSize: '1.3rem', 
              fontWeight: '800', 
              color: 'var(--text-primary)',
              marginTop: '16px',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ 
                height: '4px', 
                width: '24px', 
                background: accentColor, 
                borderRadius: '10px',
                opacity: 0.8
              }} />
              {text}
            </h4>
          );
        }

        // Checklist Items (•)
        if (trimmed.startsWith('•')) {
          return (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '14px', 
              alignItems: 'flex-start',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
              <CheckCircle size={16} style={{ color: accentColor, marginTop: '4px', flexShrink: 0 }} />
              <span style={{ fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                {trimmed.slice(1).trim().split('**').map((part, i) => 
                  i % 2 === 1 ? <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{part}</strong> : part
                )}
              </span>
            </div>
          );
        }

        // Warnings / Prohibitions ("")
        if (trimmed.startsWith('""')) {
          return (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '14px', 
              alignItems: 'flex-start',
              padding: '16px 20px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              color: 'var(--text-secondary)'
            }}>
              <AlertTriangle size={18} style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '800', color: '#ef4444', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>Legal Caution</span>
                <span style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                  {trimmed.slice(2).trim().split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part
                  )}
                </span>
              </div>
            </div>
          );
        }

        // Step indicator (Step 1, Step 2, etc.)
        if (trimmed.toLowerCase().startsWith('step ')) {
          return (
            <div key={idx} style={{ 
              background: 'linear-gradient(90deg, var(--color-bg-elevated), transparent)',
              padding: '10px 16px',
              borderRadius: '8px',
              borderLeft: `4px solid ${accentColor}`,
              fontSize: '1.1rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginTop: '10px'
            }}>
              {trimmed}
            </div>
          );
        }

        // Paragraphs
        return (
          <p key={idx} style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.8', 
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            {trimmed.split('**').map((part, i) => 
              i % 2 === 1 ? <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
};

const LegalResourcesPage = ({ onBack }) => {
  const [selectedResource, setSelectedResource] = useState(null);

  const legalResources = [
    {
      id: 'terms-of-service',
      title: 'Platform Terms of Service',
      category: 'Legal Agreements',
      icon: Gavel,
      color: '#ef4444',
      readTime: '12 min',
      type: 'Legal',
      summary: 'The binding legal agreement between you and Studio Agents regarding your use of the platform and AI generation services.',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          content: `By accessing or using the Studio Agents platform, you agree to be bound by these Terms of Service. If you do not agree, you must immediately cease all use of the platform and its services.`
        },
        {
          heading: '2. User Eligibility',
          content: `You must be at least 13 years of age to use this platform. If you are under 18, you represent that you have parental or guardian consent to use the service.`
        },
        {
          heading: '3. AI Generation & Content Ownership',
          content: `**Your Content:** You retain ownership of all inputs (prompts, audio uploads) you provide to the platform.
**AI Outputs:** Content generated by the AI (lyrics, beats, visuals) is provided to you under a non-exclusive license for commercial and personal use, subject to your subscription tier.
**Responsibility:** You are solely responsible for ensuring that your use of AI-generated content does not infringe on the rights of third parties or violate any laws.`
        },
        {
          heading: '4. Prohibited Conduct',
          content: `You agree not to use the platform to:
• Generate content that is illegal, harmful, or promotes discrimination.
• Attempt to reverse-engineer or "jailbreak" the underlying AI models.
• Impersonate real artists without authorization.
• Upload copyrighted material that you do not have permission to use.`
        },
        {
          heading: '5. Termination',
          content: `We reserve the right to suspend or terminate your account at any time for violations of these terms. You may delete your account at any time through the Application Settings.`
        }
      ]
    },
    {
      id: 'privacy-policy',
      title: 'Global Privacy Policy',
      category: 'Data Protection',
      icon: Shield,
      color: '#10b981',
      readTime: '10 min',
      type: 'Legal',
      summary: 'How we collect, use, and protect your personal data and creative inputs.',
      sections: [
        {
          heading: '1. Data We Collect',
          content: `We collect minimal data to provide our services:
• **Account Information:** Email address and display name.
• **Usage Data:** Generation history, project metadata, and session logs.
• **Creative Inputs:** Prompts and audio files you upload for "DNA" features.
• **Payment Info:** Processed securely via third-party providers (Stripe/Apple/Google). We do not store full credit card details on our servers.`
        },
        {
          heading: '2. How We Use Data',
          content: `Your data is used to:
• Provide and improve AI generation results.
• Manage your subscription and credit balance.
• Send critical service updates.
• Prevent fraud and abuse of the platform.`
        },
        {
          heading: '3. Data Sharing',
          content: `We do NOT sell your personal data. We share only necessary data with:
• **AI Providers:** Prompts are sent to Google (Gemini) and Replicate to generate content.
• **Cloud Infrastructure:** Firebase (Google) for secure data storage.`
        },
        {
          heading: '4. Your Rights (GDPR/CCPA)',
          content: `You have the right to access, export, or delete your data at any time. Our "Wipe Account" feature in Application Settings permanently deletes all per-user data from our production systems.`
        }
      ]
    },
    {
      id: 'copyright-101',
      title: 'Music Copyright 101: Complete Guide',
      category: 'Foundational Knowledge',
      icon: Shield,
      color: '#8b5cf6',
      readTime: '18 min',
      type: 'Guide',
      summary: 'Everything you need to know about protecting your creative work and understanding your rights as a music creator.',
      sections: [
        {
          heading: 'What is Copyright?',
          content: `Copyright is your automatic legal protection the moment you create an original work. No registration required—though registration offers additional benefits.

**The Two Copyrights in Music:**

1. **Composition Copyright (©)**
   • Lyrics and melody
   • Chord progressions and structure
   • Arrangement and form
   • Owned by songwriter(s)

2. **Sound Recording Copyright (℗)**
   • The actual audio recording
   • Performance and production
   • Mix and master
   • Owned by recording artist/producer

**Example:**
If you write and record a song yourself, you own BOTH copyrights. If you write a song and someone else records it, you own the composition, they own that particular recording.

**Duration of Protection:**
• Your lifetime + 70 years (US law)
• Works for hire: 95 years from publication or 120 years from creation, whichever is shorter
• Applies automatically in 180+ countries through international treaties`
        },
        {
          heading: 'Why Register Your Copyright',
          content: `Registration with the US Copyright Office isn't required for protection, but it unlocks powerful benefits:

**Legal Advantages:**
•  **Sue for infringement** - Required before filing lawsuit
•  **Statutory damages** - Up to $150,000 per work infringed (vs. proving actual damages)
•  **Attorney's fees** - Court can order infringer to pay your legal costs
•  **Public record** - Official timestamp of your ownership
•  **Evidence** - Prima facie proof in court

**Registration Timeline Benefits:**
• **Before publication**: Get full statutory damages
• **Within 3 months of publication**: Still qualify for statutory damages
• **After 3 months**: Only actual damages (harder to prove, lower amounts)

**Cost & Process:**
• $65 online registration (2-3 months processing)
• $125 expedited processing (1-2 weeks)
• Form PA (Performing Arts) or SR (Sound Recording)
• Upload MP3 or audio file
• Typically approved within 3-6 months

**Pro Tip:**
Register your best work immediately. For everything else, consider batch registration—up to 10 unpublished songs for one $65 fee as a collection.`
        },
        {
          heading: 'How to Register (Step-by-Step)',
          content: `**Online Registration Process:**

**Step 1: Create Account**
• Visit copyright.gov
• Click Register a Work
• Create eCO (electronic Copyright Office) account
• Free to create

**Step 2: Choose Form**
• Form PA: Published or unpublished musical composition
• Form SR: Sound recording
• Form PA/SR: Both composition and recording (same author)

**Step 3: Complete Application**
• Title of work
• Author information (you or your publishing company)
• Year of completion
• Year of publication (if published)
• Copyright claimant (usually same as author)
• Rights and permissions contact

**Step 4: Pay Fee**
• Standard: $65 (online)
• Special handling: $800+ (if you need it in 1-5 business days)

**Step 5: Upload Deposit**
• MP3 or WAV file
• Lyric sheet (optional but recommended)
• Lead sheet if you have one

**Step 6: Submit & Wait**
• Processing time: 3-6 months typical
• Check status in your eCO account
• Certificate arrives via email

**Common Mistakes to Avoid:**
"" Waiting too long after release
"" Not including all co-writers
"" Incorrect publication date
"" Missing lyric attachments
"" Wrong form selection`
        },
        {
          heading: 'Copyright Infringement & Enforcement',
          content: `**What Constitutes Infringement:**

To prove copyright infringement, you must show:
1. **You own a valid copyright** (registration helps prove this)
2. **The accused had access** to your work
3. **Substantial similarity** exists between the works

**Substantial Similarity Explained:**
Courts look at:
• Melodic similarities
• Lyrical similarities
• Harmonic progression patterns
• Overall feel and structure
• Not just a few notes or common phrases

**Common Phrase Exception:**
You can't copyright:
• Song titles
• Common chord progressions (I-V-vi-IV)
• Generic lyrics (baby I love you)
• Musical styles or genres

**If Someone Infringes Your Copyright:**

**Step 1: Document Everything**
• Screenshots, URLs, dates discovered
• Copies of the infringing work
• Your original work with timestamp
• Any communication with infringer

**Step 2: Send DMCA Takedown Notice**
For online infringement:
• Email platform (YouTube, Spotify, SoundCloud)
• Include your copyright registration number
• Describe infringement specifics
• Most platforms respond within 7 days

**Step 3: Cease and Desist Letter**
• Send via certified mail
• Detail the infringement
• Demand they stop and remove content
• Set deadline (typically 10-14 days)
• Many issues resolve at this stage

**Step 4: Legal Action**
If needed, consult an entertainment attorney:
• Must have registered copyright
• Must prove damages or seek statutory damages
• Consider settlement vs. court costs
• Most cases settle out of court

**Damages You Can Claim:**
• **Actual damages**: Lost profits, licensing fees
• **Statutory damages**: $750-$30,000 per work (or up to $150,000 if willful)
• **Attorney's fees**: If registered before infringement
• **Injunctions**: Court order to stop infringement

**Statute of Limitations:**
• 3 years from discovery of infringement
• Each new instance restarts the clock`
        },
        {
          heading: 'Fair Use & Sampling',
          content: `**Fair Use Doctrine:**

Four factors courts consider:
1. **Purpose and character** - Educational? Transformative? Commercial?
2. **Nature of the work** - Creative works get more protection than factual
3. **Amount used** - How much of the original work?
4. **Market effect** - Does it hurt the original's market value?

**Music-Specific Fair Use Examples:**

•  **Generally Considered Fair Use:**
• Academic music theory analysis
• Parody (if clearly mocking the original)
• Educational reviews and criticism
• Short clips in documentary commentary

"" **NOT Fair Use in Music:**
• Sampling without permission (even 2 seconds)
• Tribute covers sold commercially
• Remixes without a license
• Background music in monetized videos

**The Sampling Reality:**
Despite urban myths, there is NO 3-second rule or 7-note rule.
• ANY recognizable sample needs clearance
• Two licenses required: Master (recording) + Publishing (composition)
• Costs vary: $0 (denied) to $100,000+
• Major labels almost always say no or charge high fees

**Sample Clearance Process:**
1. Identify **Master Rights** holder (record label)
2. Identify **Publishing Rights** holder (songwriter/publisher)
3. Send clearance request with:
   - How much you're sampling
   - How it's used in your song
   - Expected release scale
4. Negotiate fees and royalty splits
5. Get written agreements before releasing

**Alternatives to Sampling:**
• Interpolation (re-record the melody/lyrics legally)
• Work with lesser-known artists (easier clearance)
• Use royalty-free sample libraries
• Create original compositions inspired by

**Consequences of Uncleared Samples:**
• Entire song profits seized
• Lawsuit for statutory damages
• Removed from all platforms
• Permanent industry reputation damage
• No accidentally defense`
        },
        {
          heading: 'International Copyright Protection',
          content: `**Global Protection Through Treaties:**

**Berne Convention (180+ countries):**
• Automatic protection in all member countries
• No registration required
• Your US copyright works in UK, EU, Japan, etc.
• Protection lasts life + 50-70 years (varies by country)

**Key Countries Covered:**
• All of Europe
• Canada, Mexico, Australia
• Brazil, Argentina, Chile
• Japan, South Korea, India
• South Africa, Kenya, Nigeria

**Important Exceptions:**
• Some Middle Eastern countries have limited protections
• China: Member since 1992, enforcement varies
• Russia: Member, but enforcement can be challenging

**Enforcing Rights Internationally:**

**Digital Content (Streaming):**
• DMCA works globally for most platforms
• Spotify, Apple Music, YouTube honor takedowns worldwide
• Use platform's infringement reporting system

**Physical Distribution:**
• More complex—requires local legal action
• Join your country's collecting society
• They have reciprocal agreements internationally

**International Registration:**
You don't need to register in each country, but it can help:
• UK: Intellectual Property Office
• EU: EUIPO (European Union Intellectual Property Office)
• Registration costs vary (£0-200 typically)

**Collecting International Royalties:**
Join your local Performance Rights Organization (PRO):
• **US**: ASCAP, BMI, or SESAC
• **UK**: PRS for Music
• **EU**: GEMA (Germany), SACEM (France), etc.
• **Worldwide**: These organizations share data and collect for you

Your PRO automatically collects:
• Radio play in 180+ countries
• TV and film usage globally
• Streaming royalties worldwide
• Live performance fees internationally

**Pro Tip:**
Also register with SoundExchange (US) or equivalent for digital performance royalties—this is separate from your PRO and can be significant income.`
        }
      ]
    },
    {
      id: 'split-sheets',
      title: 'Split Sheet Template & Best Practices',
      category: 'Essential Templates',
      icon: FileText,
      color: '#06b6d4',
      readTime: '10 min',
      type: 'Template',
      summary: 'Protect your collaborations with proper split sheet documentation—the single most important document in music creation.',
      sections: [
        {
          heading: 'What is a Split Sheet?',
          content: `A split sheet is a simple written agreement that documents:
• **Who** created the song
• **What percentage** of ownership each person has
• **Contact information** for royalty collection
• **Date and location** of creation

**Why Split Sheets Are CRITICAL:**

Whoever owns the publishing owns the money.

Real-world consequences of not having split sheets:
• Metro Boomin vs. Future lawsuit over Mask Off (settled for millions)
• Drake vs. Detail dispute over Fake Love
• Countless independent artists losing tens of thousands

**When to Create Split Sheets:**
•  Immediately after the writing session
•  BEFORE the song is released
•  BEFORE anyone registers the copyright
•  While everyone is still friendly

**What Happens Without One:**
• Default: Equal split among all writers (could be 1/5 instead of your agreed 1/2)
• Costly legal battles to prove your contribution
• Delayed releases while disputes are resolved
• Potential loss of your work entirely
• Destroyed professional relationships

**The Golden Rule:**
No split sheet, no song release.
Insist on this EVERY TIME you co-write.`
        },
        {
          heading: 'Split Sheet Template',
          content: `**SONG SPLIT SHEET AGREEMENT**

**Song Information:**
• Song Title: _______________________
• Date Written: _______________________
• Location: _______________________
• Total Length: ________ minutes

**Writers & Publishers:**

Writer 1:
• Legal Name: _______________________
• Stage Name: _______________________
• Role: –¡ Lyrics –¡ Music –¡ Both
• Ownership %: ________%
• Email: _______________________
• Phone: _______________________
• PRO: –¡ ASCAP –¡ BMI –¡ SESAC  Member ID: __________
• Publisher (if any): _______________________
• IPI/CAE #: _______________________

Writer 2:
• Legal Name: _______________________
• Stage Name: _______________________
• Role: –¡ Lyrics –¡ Music –¡ Both
• Ownership %: ________%
• Email: _______________________
• Phone: _______________________
• PRO: –¡ ASCAP –¡ BMI –¡ SESAC  Member ID: __________
• Publisher (if any): _______________________
• IPI/CAE #: _______________________

[Add additional writers as needed—total must equal 100%]

**Producer Credits (Sound Recording):**
• Producer Name: _______________________
• Producer %: ________% (of master recording)
• Producer Fee: $________ (if applicable)
• Advance Recoupable: –¡ Yes –¡ No

**Agreement Terms:**

1. The above percentages represent ownership of the **musical composition** copyright only.
2. All writers agree these splits are final and binding.
3. Copyright will be registered with the US Copyright Office under these terms.
4. Each writer is responsible for registering their share with their PRO.
5. Any licensing or sync opportunities require unanimous approval.
6. Changes to this agreement require written consent from all parties.

**Signatures:**

___________________________  Date: __________
Writer 1 Signature

___________________________  Date: __________
Writer 2 Signature

**ATTACH THIS TO YOUR COPYRIGHT REGISTRATION**`
        },
        {
          heading: 'How to Determine Fair Splits',
          content: `**Standard Industry Splits:**

**Solo Writer + Producer:**
• Writer: 50% composition
• Producer: 50% composition (if they contributed melodically/harmonically)
• Producer: 2-5% of master recording (or flat fee)

**Two Writers, One Producer:**
• Writers: 25% each (50% total)
• Producer: 50% composition
• OR: Writers 50% each, producer gets flat fee + master points

**Full Band Session:**
• Equal splits (everyone gets 25% if 4 people)
• OR: Based on actual contribution

**What Counts as Writing:**

•  **Does Count:**
• Writing lyrics
• Creating melodies
• Chord progressions
• Song structure/arrangement
• Topline melodies
• Hook/chorus concepts

"" **Doesn't Count (typically):**
• Engineering/recording
• Mixing or mastering
• Playing an instrument (unless also writing)
• Being in the room
• Emotional support
• Ordering food

**Negotiation Tips:**

**For Producers:**
• If you created the beat from scratch: 33-50%
• If you used a sample pack loop: 15-25%
• If you just mixed: 0% (get paid for mixing separately)

**For Lyricists:**
• Wrote all lyrics + melody: 50%+
• Wrote only lyrics: 25-40%
• Wrote hook only: 20-30%

**For Melody Writers:**
• Original melody + harmony: 40-60%
• Melody only: 30-40%

**Red Flags:**
🚩 Someone wants 50%+ but contributed <20%
🚩 Let's figure it out later (NO—do it NOW)
🚩 Pressure to sign without reading
🚩 Someone refuses to sign a split sheet

**Conflict Resolution:**
If you can't agree:
• Use a neutral mediator
• Base it on time spent on each element
• Consider future collaboration value
• Walk away if necessary—protect yourself`
        },
        {
          heading: 'Registering Your Split Sheet',
          content: `**After Everyone Signs:**

**Step 1: Each Writer Registers with Their PRO**
• ASCAP: ascap.com (register the song + your share)
• BMI: bmi.com (register the song + your share)
• SESAC: sesac.com (invitation-only, contact them)

**Information Needed:**
• Song title
• Your percentage
• Co-writers' names and PROs
• ISWC (International Standard Musical Work Code) if assigned

**Step 2: Register Copyright**
• One person files (usually the lead writer)
• Attach the split sheet to the application
• List all writers and percentages
• Each writer listed becomes a copyright claimant

**Step 3: Distribute Copies**
• Every writer gets a signed copy
• Keep PDF backup in the cloud
• Include with master recordings
• Provide to label/distributor if signed

**Step 4: Update Your Records**
• Store in Project Hub
• Add to personal database
• Tag with release date
• Link to final master file

**Digital Split Sheet Tools:**
• Lyric splits: online platform for splits
• Songtrust: split sheet + publishing admin
• TuneRegistry: blockchain-verified splits
• Studio Agents: integrated split sheet management (coming soon)

**Legal Enforceability:**
Split sheets are legal contracts if:
•  All parties are 18+ (or have guardian signature)
•  All parties signed willingly
•  All parties received a copy
•  Terms are clear and specific
•  Total percentages = 100%

**If Someone Won't Sign:**
• Don't release the song
• Don't register the copyright
• Don't invest more time/money
• Walk away if necessary

Your protection is worth more than one song.`
        },
        {
          heading: 'Advanced Split Scenarios',
          content: `**Samples & Interpolations:**

**If You Sample:**
• Original song owners get 50-100% of your new composition
• Negotiate BEFORE creating—most decline or want majority
• Budget for clearance: $5,000-$100,000+

**If You Interpolate (Re-sing/play):**
• Original songwriters get their % of your new composition (typically 25-50%)
• You don't need master clearance (you're re-recording)
• Still need publishing clearance—cheaper than sampling

**Example:**
You write new lyrics over a re-sung melody from Hotline Bling:
• Drake's team: 50% of your composition
• You: 50% of your composition

**Work for Hire Situations:**

**You're Hired to Write:**
• You get 0% ownership
• You get a flat fee instead
• Must sign work-for-hire agreement
• They own copyright entirely

**You Hire Someone:**
• They get 0% ownership
• Pay them a fair fee upfront
• Have them sign work-for-hire agreement
• You own 100% copyright

**Example Rates:**
• Session writer: $500-$5,000 per song
• Producer: $1,000-$10,000+ per track
• Top-tier: $25,000-$100,000+

**Ghost Writing:**
• You write, someone else takes credit
• No ownership, no royalties
• Flat fee only (negotiate high)
• NDA usually required
• Common in pop, hip-hop, EDM

**Publishing Deals:**

**If You Have a Publisher:**
• You still own your writer's share (50% of composition)
• Publisher owns publisher's share (other 50%)
• Split sheet shows you as writer, your publisher as publisher
• You still get paid—publisher collects and pays you

**Co-Publishing:**
• You keep 75% (your 50% writer + 25% publisher)
• Publisher gets 25%
• More favorable deal

**International Collaborations:**

**Writers in Different Countries:**
• Each registers with their local PRO
• PROs handle international collection
• Split sheet still required
• Use universal terms (percentages, not specific amounts)

**Currency & Payment:**
• PROs handle currency conversion
• You receive payment in your local currency
• May take 12-18 months for international royalties to arrive

**Language Adaptations:**
• New lyrics in another language = new copyright work
• Original writers get % of adaptation
• Adapter gets % for their lyrics
• Negotiate clearly: 50/50 or 70/30 typical`
        }
      ]
    },
    {
      id: 'sync-licensing',
      title: 'Sync Licensing: Film, TV & Advertising',
      category: 'Revenue Streams',
      icon: Tv,
      color: '#f59e0b',
      readTime: '14 min',
      type: 'Guide',
      summary: 'Unlock one of music\'s most lucrative revenue streams - placing your songs in visual media.',
      sections: [
        {
          heading: 'What is Sync Licensing?',
          content: `Sync (synchronization) licensing is permission to use your music in visual media:
• TV shows and films
• Commercials and ads
• Video games
• Trailers and promos
• YouTube videos and social media content
• Corporate videos and presentations

**Why Sync is Lucrative:**

💰 **Payment Range:**
• YouTube video: $50-$500
• Indie film: $500-$5,000
• Network TV episode: $2,500-$15,000
• Cable TV show: $1,000-$5,000
• National commercial: $25,000-$500,000+
• Major film: $15,000-$100,000+
• Video game: $5,000-$50,000+

Plus you keep:
• Ongoing performance royalties every time it airs
• Streaming residuals
• International broadcast royalties

**Real Example:**
Dog Days Are Over by Florence + The Machine in commercials:
• Multiple sync fees: ~$500,000 total
• Performance royalties: ~$200,000+/year
• Career exposure: Invaluable

**The Two Licenses Required:**

1. **Synchronization License** (composition/publishing)
   - Permission to use the song (melody, lyrics, composition)
   - Negotiated with songwriter or publisher

2. **Master Use License** (recording)
   - Permission to use the specific recording
   - Negotiated with recording owner (artist, label, or producer)

**If you wrote AND recorded it yourself:**
You control both licenses—negotiate both fees.`
        },
        {
          heading: 'How to Get Sync Placements',
          content: `**Route 1: Sync Licensing Agencies**

Submit your music to agencies that pitch to music supervisors:

**Top Sync Agencies:**
• **Musicbed** - High-end film/TV/commercial
• **Artlist** - Subscription model, steady income
• **Epidemic Sound** - YouTube/social media focus
• **Marmoset** - Boutique, selective
• **AudioSocket** - Broad catalog
• **Music Vine** - Emerging artists

**Pros:**
•  They handle all negotiations
•  Established supervisor relationships
•  Regular payment
•  Global opportunities

**Cons:**
"" Non-exclusive can limit big placements
"" Lower fees (you split with agency)
"" High competition in catalog

**Route 2: Direct to Music Supervisors**

Build relationships with the people who place music:

**Where to Find Them:**
• IMDb Pro (credits for TV shows/films)
• Guild of Music Supervisors directory
• LinkedIn (search music supervisor)
• Industry events (SXSW, Sundance, etc.)

**How to Approach:**
1. Research what they've placed before
2. Send personalized email (not mass)
3. Include 3-5 relevant tracks
4. Make it EASY: streaming links, metadata included
5. Follow up once after 2 weeks, then move on

**Email Template:**

*Subject: Indie pop track for [Specific Project] consideration*

Hi [Name],

I noticed you supervised [Show/Film] and loved how you used [Artist] in [Scene]. I have a track that might fit your upcoming projects.

Song Title - [Genre] - [Mood] - [BPM] - [Duration]
[Streaming Link]

Instrumental available, fully cleared, master + publishing controlled.

Quick question: What upcoming projects are you sourcing for?

Best,
[Your Name]
[Website] | [Phone]

**Route 3: Sync Licensing Platforms**

**Syncr (sync. .com):**
• Upload your catalog
• Supervisors search and license directly
• You set your prices
• Platform takes 30%

**SongTradr:**
• Global marketplace
• AI-powered matching
• Brief notifications
• Professional network

**Songfinch:**
• Custom song commissions
• Great for building sync portfolio
• Steady income potential

**Route 4: YouTube & Social Media**

Don't overlook micro-licensing:

**Platforms:**
• **Lickd** - YouTube creator licensing
• **Epidemic Sound** - Subscription for creators
• **Artlist** - Popular with video creators

Thousands of small licenses = significant income.`
        },
        {
          heading: 'Creating Sync-Friendly Music',
          content: `**What Music Supervisors Look For:**

**Technical Requirements:**
•  **Clean/Instrumental versions** - Essential
•  **High-quality recording** - Professional mix/master
•  **Stems available** - Separate tracks for flexibility
•  **Multiple lengths** - :30, :60, full length
•  **Clear ownership** - No samples, no clearance issues

**Content Guidelines:**

**Best for Sync:**
• Universal themes (love, journey, triumph, loss)
• Clear but not overly specific lyrics
• Emotional without being cheesy
• Current production style
• Moderate BPM (80-130)

**Avoid:**
• Explicit language
• Brand name mentions
• Highly specific references
• Overly political content
• Dark/disturbing themes (limited use)

**Production Tips:**

1. **Leave Space**
   - Don't over-produce
   - Room for dialogue
   - Clean, uncluttered mix

2. **Think Cinematically**
   - Build and release tension
   - Clear sections (verse/chorus)
   - Dynamic range

3. **Multiple Versions**
   - Full mix
   - Instrumental
   - No drums
   - Ambient/underscore
   - Short edits (30s, 60s, 90s)

4. **Genre Matters**
   - **Indie pop/folk**: Coffee commercials, feel-good shows
   - **Hip-hop/trap**: Sports, urban dramas, trailers
   - **Ambient/electronic**: Tech ads, documentaries, sci-fi
   - **Rock/alternative**: Action, youth-oriented content
   - **Classical/orchestral**: Luxury brands, period pieces

**Metadata is CRUCIAL:**

Every track needs:
• BPM
• Key
• Mood tags (uplifting, melancholic, energetic)
• Instrumentation
• Vocal/instrumental
• Genre/subgenre
• Era/decade feel
• Cultural context

Music supervisors search by these terms—tag accurately.`
        },
        {
          heading: 'Negotiating Sync Deals',
          content: `**Understanding the Offer:**

**Typical Deal Points:**

1. **Term**
   • Perpetuity (forever) vs. limited (1-5 years)
   • Perpetuity pays more upfront, limited can re-license later

2. **Territory**
   • Worldwide, US only, or specific regions
   • Worldwide = higher fee

3. **Media**
   • All media vs. TV only, film only, etc.
   • Broader rights = higher fee

4. **Exclusivity**
   • Can the same music be used elsewhere?
   • Exclusive = much higher fee

5. **Usage**
   • Background, featured, theme song
   • How many episodes/scenes
   • Featured/theme = higher fee

**Fee Negotiation:**

**Starting Points (US Network TV):**
• Background use, one episode: $2,500-$5,000
• Featured use, one episode: $5,000-$15,000
• Theme song, one season: $50,000-$200,000

**Your Negotiating Power Depends On:**
• Your track's uniqueness
• Budget of the project
• How badly they want YOUR song
• Timeline pressure (last-minute = higher fee)
• Your willingness to walk away

**Negotiation Email Template:**

*Thank you for considering [Song] for [Project]. I'm excited about this opportunity.*

*My standard rate for [usage type] in [media type] with [territory] rights is $[X].*

*Given [specific reason: tight budget, emerging artist, portfolio building], I can offer $[Y] for this placement.*

*This includes both master and sync licenses, instrumental version, and [any extras].*

*Would this work within your budget?*

**Counter-Offer Strategy:**
• They offer $1,000, you wanted $5,000
• Counter at $3,500 with justification
• Meet in the middle: $2,000-$2,500
• Know your minimum—be willing to walk

**Red Flags:**
🚩 Exposure only (no payment)
🚩 Requesting 100% ownership transfer
🚩 Perpetuity worldwide exclusivity for low fee
🚩 No written agreement
🚩 Vague usage terms

**Contract Checklist:**
•  Fee amount and payment schedule
•  Usage details (how, where, when)
•  Territory and term specified
•  Credit terms (if applicable)
•  Performance royalty rights retained
•  Option to license elsewhere (if non-exclusive)
•  Approval rights (for edits/changes)`
        },
        {
          heading: 'After the Placement',
          content: `**Maximizing Your Sync Success:**

**1. Register with Your PRO**
• File cue sheet information
• Track title, duration, usage type
• This ensures you get performance royalties

**2. Collect Performance Royalties**
Every time your sync airs on TV:
• Your PRO tracks broadcasts
• You earn per airing
• Can add up to more than the original sync fee

**Example:**
$5,000 sync fee for one episode
+ $250 per broadcast
Ã- 10 airings (original + reruns)
+ International broadcasts
= $7,500-$15,000 total

**3. Promote the Placement**
• Share on social media (with permission)
• Update your website/EPK
• Mention in pitches to other supervisors
• Add to your Sync Resume

**4. Build the Relationship**
• Thank the music supervisor
• Ask for feedback
• Keep them updated on new releases
• Don't be pushy—be professional

**5. Track Your Success**
Create a Sync Database:
• Project name, date, fee
• Supervisor contact
• Contract terms
• Payment status
• Performance royalty tracking

**Long-Term Sync Career:**

**Year 1-2: Portfolio Building**
• Accept lower fees for credits
• Build relationships
• Learn what works
• Goal: 5-10 placements

**Year 3-5: Established**
• Command higher fees
• Selective about projects
• Repeat clients
• Goal: $20,000-$50,000/year

**Year 5+: Successful Sync Career**
• Known by supervisors
• Regular placements
• Strategic high-value deals
• Goal: $50,000-$200,000+/year

**Success Story:**
ZZ Ward: Indie blues artist
• 30+ sync placements in 5 years
• Featured in Suits, Hart of Dixie, Walmart commercials
• Sync income: $300,000+ estimated
• Launched her touring career through exposure

Sync can be your sustainable income while building your artist career.`
        }
      ]
    },
    {
      id: 'music-publishing',
      title: 'Music Publishing 101: Collect What You\'re Owed',
      category: 'Revenue Streams',
      icon: CreditCard,
      color: '#22c55e',
      readTime: '16 min',
      type: 'Guide',
      summary: 'Understand the complex world of music publishing and ensure you\'re collecting every dollar you\'ve earned.',
      sections: [
        {
          heading: 'What is Music Publishing?',
          content: `Music publishing is the business of protecting and monetizing musical compositions (the songs themselves—not recordings).

**The Two Halves of a Composition:**

**1. Writer's Share (50%)**
• Belongs to the songwriter(s)
• Paid directly to you
• Cannot be sold or signed away
• Collected by your PRO

**2. Publisher's Share (50%)**
• Can be kept by you (self-published)
• Or assigned to a publishing company
• Handles administration, licensing, collection
• Split between you and publisher if signed

**Example:**
Your song earns $10,000 in royalties:
• $5,000 goes to writer's share •' You
• $5,000 goes to publisher's share •' You (if self-published) OR you + publisher (if signed)

**What Publishers Actually Do:**

**Administration Publishing (10-25% commission):**
• Register your songs worldwide
• Collect royalties from all sources
• Handle licensing paperwork
• Audit companies to ensure payment
• YOU retain ownership

**Traditional Publishing Deal (50% of publisher's share):**
• They own 50% of publisher's share (or more)
• Provide advance payment
• Actively pitch your songs
• Fund demos and recordings
• Career development

**Co-Publishing Deal (Most common for established artists):**
• Split publisher's share 50/50
• You get: 50% writer + 25% publisher = 75% total
• They get: 25% of publisher's share
• Balance of benefits and ownership`
        },
        {
          heading: 'Types of Publishing Royalties',
          content: `**1. Performance Royalties**

Earned when your song is performed publicly:
• Radio (AM/FM, satellite, internet)
• TV broadcasts
• Streaming (Spotify, Apple Music, etc.)
• Live venues (concerts, bars, restaurants)
• Background music (stores, offices)

**How It Works:**
• Collected by PROs (ASCAP, BMI, SESAC)
• Venues/platforms pay blanket licenses
• PROs distribute to songwriters
• You must be registered with a PRO

**Payment Timeline:**
• Quarterly distributions
• 6-12 month lag from performance to payment

**Typical Earnings:**
• 1 million Spotify streams: ~$500-$800 in performance royalties
• Local radio play: $50-$500 per play (varies by market)
• National TV show: $1,000-$5,000+ per episode

**2. Mechanical Royalties**

Earned when your song is reproduced:
• Physical CD/vinyl sales
• Digital downloads (iTunes, etc.)
• Interactive streams (Spotify, Apple Music)

**US Statutory Rate (2025):**
• Physical/download: 12.4¢ per copy (songs <5 min)
• Streaming: $0.006-$0.01 per stream (complicated formula)

**Who Collects:**
• US: Mechanical Licensing Collective (MLC) for streaming
• US: Harry Fox Agency for physical/downloads
• International: Local mechanical rights societies

**You Must:**
• Register with The MLC (free at themlc.com)
• Join Harry Fox or use a distributor
• Provide correct metadata to streaming platforms

**3. Synchronization Royalties** (Covered earlier)
• TV, film, commercials, video games
• Negotiated per use
• One-time fees + ongoing performance royalties

**4. Print Royalties**
• Sheet music sales
• Lyric books
• Guitar tabs

**Earnings:**
• 10-20% of retail price
• Niche but can add up

**5. Micro-Sync / Digital Performance**
• YouTube Content ID
• Social media uses (TikTok, Instagram)
• Video game integrations
• Ringtones (yes, still a thing)

**Collected by:**
• Publishing administrator
• YouTube via Content ID
• Direct licensing platforms

**Total Potential Income Sources:**
A successful song can earn from 15+ different royalty streams simultaneously.`
        },
        {
          heading: 'DIY Publishing: Keep 100%',
          content: `**Step 1: Create Your Own Publishing Company**

**Why:**
• Collect 100% of royalties (both writer & publisher shares)
• Professional presentation
• Tax benefits
• Ownership and control

**How to Set Up:**

**1. Choose a Company Name**
• Can't be same as existing publisher (check ASCAP/BMI databases)
• Often [Your Name] Music, [Your Name] Publishing
• Examples: Luna Records Publishing, Skyline Songs

**2. Register as a Business**
• LLC recommended ($50-$500 depending on state)
• Sole proprietorship works too (simpler, less protection)
• Get EIN from IRS (free, online)

**3. Affiliate with a PRO**
• ASCAP, BMI, or SESAC
• Register yourself as writer
• Register your publishing company as publisher
• Costs: $0-$150 depending on PRO

**4. Open Publishing Bank Account**
• Separate from personal finances
• Track publishing income
• Easier taxes and accounting

**Step 2: Register Your Songs**

**With Your PRO:**
• Song title
• Writers and percentages
• Your publishing company name
• Do this BEFORE release

**With Mechanical Licensing Collective:**
• themlc.com (free)
• Ensures streaming mechanical royalty collection
• Required for US streaming income

**With Copyright Office:**
• Optional but recommended
• Strengthens legal protection
• One-time $65 fee

**Step 3: Distribute with Publishing Admin**

**Option A: Full DIY** (100% royalties, more work)
• Register with every collection society globally (20+ countries)
• Monitor and track usage yourself
• File claims manually
• Best if: Low volume, specific territories

**Option B: Publishing Administrator** (85-90% royalties, less work)

**Top Admin Services:**
• **Songtrust**: $100/year + 15% commission
• **CD Baby Pro**: $30-$70/year + small commission
• **TuneCore Publishing**: $75/year + 20% commission
• **Sentric Music**: Free + 20% commission (UK-based)

**What They Do:**
•  Register your songs in 100+ territories
•  Collect from 60+ collection societies
•  YouTube Content ID management
•  Sync licensing opportunities
•  Royalty tracking dashboard
•  Audit services

**Option C: Hybrid**
• Use administrator for collection
• Handle sync licensing yourself
• Best of both worlds

**Recommendation:**
If you're serious about music career, use an administrator. The 10-15% commission is worth the global collection and time saved.`
        },
        {
          heading: 'Understanding PROs',
          content: `**Performance Rights Organizations (PROs):**

**ASCAP (American Society of Composers, Authors and Publishers)**
• Non-profit
• Member-owned (you get voting rights)
• 850,000+ members
• Costs: Writer $50, Publisher $50
• Payment: Quarterly
• Best for: Traditional songwriters, established artists

**BMI (Broadcast Music, Inc.)**
• For-profit (but treats members fairly)
• Free to join (writer & publisher)
• 1.1 million+ members
• Payment: Quarterly
• Best for: Anyone, especially starting out (no fees)

**SESAC (Society of European Stage Authors & Composers)**
• For-profit, selective (invitation only)
• Smaller (30,000+ members)
• Higher per-play rates
• Payment: Quarterly
• Best for: Established writers, specific genres

**Global Music Rights (GMR)**
• Boutique, invitation-only
• For high-value catalogs
• Negotiates higher rates
• Best for: Hits and major placements

**Which Should You Choose?**

**Choose based on:**
• Cost (BMI is free)
• Genre representation (ASCAP strong in film/TV, BMI in pop/hip-hop)
• Advances (some PROs offer advances to established writers)
• Personal connection (who responds to your questions?)

**You Can Only Join ONE PRO** (per country)
• You can't switch easily (2-year commitment typically)
• Your publishing company can be with a different PRO than you as a writer
• Example: You as writer with ASCAP, your publishing company with BMI

**What Your PRO Does:**

•  Licenses venues, radio, streaming services
•  Monitors where your music is performed
•  Distributes royalties to you
•  Advocates for songwriter rights
•  Provides legal resources

"" Does NOT:
• Collect mechanical royalties (that's MLC/Harry Fox)
• Handle sync licensing (that's you or your publisher)
• Promote your music
• Get you placements

**Registering Your Songs:**

**Required Information:**
• Song title
• Writers (you + any co-writers with their PROs)
• Publishers (your company name)
• Ownership percentages
• ISWC (if you have one)

**Do This:**
• Register BEFORE release
• Update after any changes
• Register every song, even demos
• Keep your contact info current

**Checking Your Royalties:**
• Log in quarterly
• Review usage reports
• Flag any missing plays
• File disputes if needed

**Average Royalty Examples:**
• Local radio (top 50 market): $200-$400 per play
• National radio (top 10 market): $500-$1,000+ per play
• Cable TV background use: $20-$100 per 30 seconds
• Streaming (1 million plays): $500-$800 total
• Coffee shop background: $0.01-$0.05 per play (adds up!)

**Pro Tip:**
Set aside 30% of your publishing income for taxes. Royalties are self-employment income.`
        },
        {
          heading: 'International Collection',
          content: `**The Challenge:**

Your song streams in 200+ countries. Each country has its own collection society. Without representation, you're leaving money on the table.

**Collection Societies by Territory:**

**Europe:**
• UK: PRS for Music
• Germany: GEMA
• France: SACEM
• Spain: SGAE
• Scandinavia: STIM (Sweden), TONO (Norway), KODA (Denmark)

**Asia:**
• Japan: JASRAC
• South Korea: KOMCA
• China: MCSC
• India: IPRS

**Latin America:**
• Brazil: ECAD
• Mexico: SACM
• Argentina: SADAIC

**Other:**
• Canada: SOCAN
• Australia: APRA AMCOS
• South Africa: SAMRO

**How International Collection Works:**

**Without Publisher/Admin:**
• Your US PRO has reciprocal agreements
• They collect international on your behalf
• But: Can take 2-3 years and lose 20-40% in fees

**With Publishing Administrator:**
• They register directly with each society
• Faster collection (6-12 months)
• Higher royalty capture (5-15% more)
• One login to see global earnings

**Black Box Royalties:**

Black box = unclaimed royalties sitting in collection societies.

**Why It Happens:**
• Incomplete metadata
• Unregistered songs
• Writers not affiliated with societies
• Spelling errors in credits

**Estimated unclaimed royalties globally: $1-2 BILLION/year**

**How to Claim Your Share:**
1. Register with global admin (Songtrust, CD Baby Pro, etc.)
2. Ensure accurate metadata on all releases
3. Register songs before release
4. File claims for past releases (can go back 3 years typically)

**Metadata Checklist:**
•  Songwriter legal names (spelled correctly)
•  PRO affiliations
•  IPI/CAE numbers
•  Publisher names
•  ISWC codes
•  Consistent song title spelling

**Case Study:**
Independent artist discovered $18,000 in unclaimed European royalties from 2018-2021. Simple metadata fix + registration = money recovered.

**Action Items:**
1. Join a publishing administrator NOW
2. Register your entire catalog
3. File international claims
4. Update metadata on all platforms
5. Monitor quarterly statements

Publishing is complex, but it's YOUR money. Don't leave it uncollected.`
        }
      ]
    },
    {
      id: 'legal-agreements',
      title: 'Standard Music Industry Agreements',
      category: 'Legal Documents',
      icon: FileText,
      color: '#10b981',
      readTime: '15 min',
      type: 'Templates',
      summary: 'Essential legal templates and guides for split sheets, work-for-hire, and management contracts.',
      sections: [
        {
          heading: 'The Essential Split Sheet',
          content: `A split sheet is a simple but critical document that specifies exactly how much each person contributed to a song and what percentage of the publishing they own.

**Why it matters:**
Without a signed split sheet, copyright defaults to equal parts (50/50 for a duo, 33/33/33 for a trio) regardless of contribution. 

**Key elements to include:**
• Producer/Songwriter legal names and IPI numbers
• Specific percentages for lyrics and melody
• Sampling clearance status
• Date and signature of all parties`
        },
        {
          heading: 'Work-for-Hire Agreements',
          content: `Used when you hire a session musician, mixing engineer, or vocalist and want to own the final product completely.

**Key Provisions:**
• **Clear transfer of ownership:** Explicitly states it's a "work made for hire."
• **One-time payment:** Specifies the flat fee instead of ongoing royalties.
• **Warranty of originality:** The hired professional guarantees they aren't infringing on other works.`
        }
      ]
    },
    {
      id: 'white-papers',
      title: 'Industry Research & Strategy Whitepapers',
      category: 'Strategic Analysis',
      icon: Target,
      color: '#3b82f6',
      readTime: '25 min',
      type: 'Data',
      summary: 'In-depth analysis of the 2025 music economy, AI integration reports, and streaming growth strategies.',
      sections: [
        {
          heading: 'The AI-Augmented Artist (2025)',
          content: `Research on how small-scale creators are using AI to compete with major label marketing budgets.

**Key Findings:**
• 340% increase in productivity for artists using AI co-writer tools.
• $2.4B projected market for generative AI in music production by 2027.
• Shift from "Human vs AI" to "Human + AI" workflows.`
        },
        {
          heading: 'Zero-Gatekeeper Distribution',
          content: `A deep dive into bypassing traditional labels through direct-to-fan platforms and blockchain-enabled licensing.

**Strategic Insights:**
• Monetization beyond streams: Digital collectibles and private communities.
• Global market access: The rise of hyper-regional success in South Asia and Africa.`
        }
      ]
    }
  ];

  if (selectedResource) {
    const Icon = selectedResource.icon;
    return (
      <div className="legal-resources-page" style={{
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        paddingTop: '80px'
      }}>
        {/* Header */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'var(--color-bg-elevated)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 100
        }}>
          <button
            onClick={() => setSelectedResource(null)}
            className="haptic-press"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px'
            }}
          >
            <ArrowLeft size={20} />
            Back to Resources
          </button>
        </div>

        {/* Content */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '40px 24px 100px'
        }}>
          {/* Title Section */}
          <div style={{
            marginBottom: '48px',
            paddingBottom: '32px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: `${selectedResource.color}15`,
              color: selectedResource.color,
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              marginBottom: '20px',
              letterSpacing: '0.5px'
            }}>
              <Icon size={14} />
              {selectedResource.type}
            </div>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '700',
              marginBottom: '16px',
              lineHeight: '1.1',
              background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {selectedResource.title}
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              {selectedResource.summary}
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <span>⏱️{selectedResource.readTime} read</span>
              <span>•</span>
              <span>{selectedResource.sections.length} sections</span>
              <span>•</span>
              <span style={{ color: selectedResource.color }}>š¡ Action Items Included</span>
            </div>
          </div>

          {/* Sections */}
          {selectedResource.sections.map((section, idx) => (
            <div key={idx} style={{
              marginBottom: '40px',
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative Subtle Background Glow */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                background: `radial-gradient(circle, ${selectedResource.color}15 0%, transparent 70%)`,
                pointerEvents: 'none'
              }} />

              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                marginBottom: '24px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                letterSpacing: '-0.5px'
              }}>
                <span style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${selectedResource.color}20`,
                  color: selectedResource.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: '800',
                  boxShadow: `0 4px 12px ${selectedResource.color}15`
                }}>
                  {idx + 1}
                </span>
                {section.heading}
              </h2>
              <div style={{
                fontSize: '1.05rem',
                lineHeight: '1.8',
                color: 'var(--text-secondary)'
              }}>
                <FormattedLegalContent content={section.content} accentColor={selectedResource.color} />
              </div>
            </div>
          ))}

          {/* Footer CTA */}
          <div style={{
            marginTop: '64px',
            padding: '32px',
            background: 'var(--color-bg-elevated)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <Shield size={40} style={{ color: selectedResource.color, marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '12px'
            }}>
              Protect Your Creative Work
            </h3>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              marginBottom: '24px'
            }}>
              Knowledge is power. Use these resources to safeguard your rights and maximize your income.
            </p>
            <button
              onClick={() => setSelectedResource(null)}
              className="cta-button-premium haptic-press"
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Explore More Resources
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Library View
  return (
    <div className="legal-resources-page" style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      paddingTop: '80px'
    }}>
      {/* Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'var(--color-bg-elevated)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            className="haptic-press"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px'
            }}
          >
            <ArrowLeft size={20} />
            Back to Studio
          </button>
          <div style={{
            width: '1px',
            height: '30px',
            background: 'var(--border-color)'
          }} />
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Legal & Business Resources
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 24px 100px'
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '64px'
        }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            borderRadius: '16px',
            marginBottom: '24px'
          }}>
            <Shield size={40} color="white" />
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '700',
            marginBottom: '16px'
          }}>
            Legal & Business Resources
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Protect your art. Understand your rights. Build a sustainable career with professional-grade legal and business knowledge.
          </p>
        </div>

        {/* Resources Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '32px'
        }}>
          {legalResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.id}
                className="resource-card haptic-press"
                onClick={() => setSelectedResource(resource)}
                style={{
                  padding: '32px',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                {/* Background Accent */}
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '120px',
                  height: '120px',
                  background: `radial-gradient(circle, ${resource.color}15 0%, transparent 70%)`,
                  pointerEvents: 'none'
                }} />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: `${resource.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 16px ${resource.color}10`
                  }}>
                    <Icon size={30} style={{ color: resource.color }} />
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    background: `${resource.color}20`,
                    color: resource.color,
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {resource.readTime}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: resource.color,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    {resource.category}
                  </div>
                  <h4 style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    marginBottom: '12px',
                    lineHeight: '1.3',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.3px'
                  }}>
                    {resource.title}
                  </h4>
                  <p style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    marginBottom: '20px',
                    display: '-webkit-box',
                    WebkitLineClamp: '3',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {resource.summary}
                  </p>
                </div>

                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '600'
                  }}>
                    <span style={{ color: resource.color }}>{resource.type}</span>
                    <span style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--border-color)'
                    }} />
                    <span>{resource.sections.length} Chapters</span>
                  </div>
                  <div style={{
                    color: resource.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '700',
                    fontSize: '0.9rem'
                  }}>
                    Read Now <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Resources CTA */}
        <div style={{
          marginTop: '64px',
          padding: '40px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <BookOpen size={48} style={{ color: '#8b5cf6', marginBottom: '20px' }} />
          <h3 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '16px'
          }}>
            Need More Help?
          </h3>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            maxWidth: '600px',
            margin: '0 auto 24px'
          }}>
            Join our monthly Legal Office Hours with music attorneys, or explore our template library for contracts, agreements, and more.
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              className="cta-button-secondary haptic-press"
              style={{
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              📅 Office Hours Schedule
            </button>
            <button
              className="cta-button-premium haptic-press"
              style={{
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              📥 Download Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalResourcesPage;


