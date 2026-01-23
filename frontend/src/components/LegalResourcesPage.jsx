import React, { useState } from 'react';
import { 
  Shield, ChevronRight, FileText, Tv, CreditCard,
  ArrowLeft, BookOpen
} from 'lucide-react';

const LegalResourcesPage = ({ onBack }) => {
  const [selectedResource, setSelectedResource] = useState(null);

  const legalResources = [
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
          content: `Copyright is your automatic legal protection the moment you create an original work. No registration requiredâ€"though registration offers additional benefits.

**The Two Copyrights in Music:**

1. **Composition Copyright (Â©)**
   â€¢ Lyrics and melody
   â€¢ Chord progressions and structure
   â€¢ Arrangement and form
   â€¢ Owned by songwriter(s)

2. **Sound Recording Copyright (â„-)**
   â€¢ The actual audio recording
   â€¢ Performance and production
   â€¢ Mix and master
   â€¢ Owned by recording artist/producer

**Example:**
If you write and record a song yourself, you own BOTH copyrights. If you write a song and someone else records it, you own the composition, they own that particular recording.

**Duration of Protection:**
â€¢ Your lifetime + 70 years (US law)
â€¢ Works for hire: 95 years from publication or 120 years from creation, whichever is shorter
â€¢ Applies automatically in 180+ countries through international treaties`
        },
        {
          heading: 'Why Register Your Copyright',
          content: `Registration with the US Copyright Office isn't required for protection, but it unlocks powerful benefits:

**Legal Advantages:**
âœ… **Sue for infringement** - Required before filing lawsuit
âœ… **Statutory damages** - Up to $150,000 per work infringed (vs. proving actual damages)
âœ… **Attorney's fees** - Court can order infringer to pay your legal costs
âœ… **Public record** - Official timestamp of your ownership
âœ… **Evidence** - Prima facie proof in court

**Registration Timeline Benefits:**
â€¢ **Before publication**: Get full statutory damages
â€¢ **Within 3 months of publication**: Still qualify for statutory damages
â€¢ **After 3 months**: Only actual damages (harder to prove, lower amounts)

**Cost & Process:**
â€¢ $65 online registration (2-3 months processing)
â€¢ $125 expedited processing (1-2 weeks)
â€¢ Form PA (Performing Arts) or SR (Sound Recording)
â€¢ Upload MP3 or audio file
â€¢ Typically approved within 3-6 months

**Pro Tip:**
Register your best work immediately. For everything else, consider batch registrationâ€"up to 10 unpublished songs for one $65 fee as a "collection."`
        },
        {
          heading: 'How to Register (Step-by-Step)',
          content: `**Online Registration Process:**

**Step 1: Create Account**
â€¢ Visit copyright.gov
â€¢ Click "Register a Work"
â€¢ Create eCO (electronic Copyright Office) account
â€¢ Free to create

**Step 2: Choose Form**
â€¢ Form PA: Published or unpublished musical composition
â€¢ Form SR: Sound recording
â€¢ Form PA/SR: Both composition and recording (same author)

**Step 3: Complete Application**
â€¢ Title of work
â€¢ Author information (you or your publishing company)
â€¢ Year of completion
â€¢ Year of publication (if published)
â€¢ Copyright claimant (usually same as author)
â€¢ Rights and permissions contact

**Step 4: Pay Fee**
â€¢ Standard: $65 (online)
â€¢ Special handling: $800+ (if you need it in 1-5 business days)

**Step 5: Upload Deposit**
â€¢ MP3 or WAV file
â€¢ Lyric sheet (optional but recommended)
â€¢ Lead sheet if you have one

**Step 6: Submit & Wait**
â€¢ Processing time: 3-6 months typical
â€¢ Check status in your eCO account
â€¢ Certificate arrives via email

**Common Mistakes to Avoid:**
âŒ Waiting too long after release
âŒ Not including all co-writers
âŒ Incorrect publication date
âŒ Missing lyric attachments
âŒ Wrong form selection`
        },
        {
          heading: 'Copyright Infringement & Enforcement',
          content: `**What Constitutes Infringement:**

To prove copyright infringement, you must show:
1. **You own a valid copyright** (registration helps prove this)
2. **The accused had access** to your work
3. **Substantial similarity** exists between the works

**"Substantial Similarity" Explained:**
Courts look at:
â€¢ Melodic similarities
â€¢ Lyrical similarities
â€¢ Harmonic progression patterns
â€¢ Overall "feel" and structure
â€¢ Not just a few notes or common phrases

**Common Phrase Exception:**
You can't copyright:
â€¢ Song titles
â€¢ Common chord progressions (I-V-vi-IV)
â€¢ Generic lyrics ("baby I love you")
â€¢ Musical styles or genres

**If Someone Infringes Your Copyright:**

**Step 1: Document Everything**
â€¢ Screenshots, URLs, dates discovered
â€¢ Copies of the infringing work
â€¢ Your original work with timestamp
â€¢ Any communication with infringer

**Step 2: Send DMCA Takedown Notice**
For online infringement:
â€¢ Email platform (YouTube, Spotify, SoundCloud)
â€¢ Include your copyright registration number
â€¢ Describe infringement specifics
â€¢ Most platforms respond within 7 days

**Step 3: Cease and Desist Letter**
â€¢ Send via certified mail
â€¢ Detail the infringement
â€¢ Demand they stop and remove content
â€¢ Set deadline (typically 10-14 days)
â€¢ Many issues resolve at this stage

**Step 4: Legal Action**
If needed, consult an entertainment attorney:
â€¢ Must have registered copyright
â€¢ Must prove damages or seek statutory damages
â€¢ Consider settlement vs. court costs
â€¢ Most cases settle out of court

**Damages You Can Claim:**
â€¢ **Actual damages**: Lost profits, licensing fees
â€¢ **Statutory damages**: $750-$30,000 per work (or up to $150,000 if willful)
â€¢ **Attorney's fees**: If registered before infringement
â€¢ **Injunctions**: Court order to stop infringement

**Statute of Limitations:**
â€¢ 3 years from discovery of infringement
â€¢ Each new instance restarts the clock`
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

âœ… **Generally Considered Fair Use:**
â€¢ Academic music theory analysis
â€¢ Parody (if clearly mocking the original)
â€¢ Educational reviews and criticism
â€¢ Short clips in documentary commentary

âŒ **NOT Fair Use in Music:**
â€¢ Sampling without permission (even 2 seconds)
â€¢ "Tribute" covers sold commercially
â€¢ Remixes without a license
â€¢ Background music in monetized videos

**The Sampling Reality:**
Despite urban myths, there is NO "3-second rule" or "7-note rule."
â€¢ ANY recognizable sample needs clearance
â€¢ Two licenses required: Master (recording) + Publishing (composition)
â€¢ Costs vary: $0 (denied) to $100,000+
â€¢ Major labels almost always say no or charge high fees

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
â€¢ Interpolation (re-record the melody/lyrics legally)
â€¢ Work with lesser-known artists (easier clearance)
â€¢ Use royalty-free sample libraries
â€¢ Create original compositions "inspired by"

**Consequences of Uncleared Samples:**
â€¢ Entire song profits seized
â€¢ Lawsuit for statutory damages
â€¢ Removed from all platforms
â€¢ Permanent industry reputation damage
â€¢ No "accidentally" defense`
        },
        {
          heading: 'International Copyright Protection',
          content: `**Global Protection Through Treaties:**

**Berne Convention (180+ countries):**
â€¢ Automatic protection in all member countries
â€¢ No registration required
â€¢ Your US copyright works in UK, EU, Japan, etc.
â€¢ Protection lasts life + 50-70 years (varies by country)

**Key Countries Covered:**
â€¢ All of Europe
â€¢ Canada, Mexico, Australia
â€¢ Brazil, Argentina, Chile
â€¢ Japan, South Korea, India
â€¢ South Africa, Kenya, Nigeria

**Important Exceptions:**
â€¢ Some Middle Eastern countries have limited protections
â€¢ China: Member since 1992, enforcement varies
â€¢ Russia: Member, but enforcement can be challenging

**Enforcing Rights Internationally:**

**Digital Content (Streaming):**
â€¢ DMCA works globally for most platforms
â€¢ Spotify, Apple Music, YouTube honor takedowns worldwide
â€¢ Use platform's infringement reporting system

**Physical Distribution:**
â€¢ More complexâ€"requires local legal action
â€¢ Join your country's collecting society
â€¢ They have reciprocal agreements internationally

**International Registration:**
You don't need to register in each country, but it can help:
â€¢ UK: Intellectual Property Office
â€¢ EU: EUIPO (European Union Intellectual Property Office)
â€¢ Registration costs vary (Â£0-200 typically)

**Collecting International Royalties:**
Join your local Performance Rights Organization (PRO):
â€¢ **US**: ASCAP, BMI, or SESAC
â€¢ **UK**: PRS for Music
â€¢ **EU**: GEMA (Germany), SACEM (France), etc.
â€¢ **Worldwide**: These organizations share data and collect for you

Your PRO automatically collects:
â€¢ Radio play in 180+ countries
â€¢ TV and film usage globally
â€¢ Streaming royalties worldwide
â€¢ Live performance fees internationally

**Pro Tip:**
Also register with SoundExchange (US) or equivalent for digital performance royaltiesâ€"this is separate from your PRO and can be significant income.`
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
      summary: 'Protect your collaborations with proper split sheet documentationâ€"the single most important document in music creation.',
      sections: [
        {
          heading: 'What is a Split Sheet?',
          content: `A split sheet is a simple written agreement that documents:
â€¢ **Who** created the song
â€¢ **What percentage** of ownership each person has
â€¢ **Contact information** for royalty collection
â€¢ **Date and location** of creation

**Why Split Sheets Are CRITICAL:**

"Whoever owns the publishing owns the money."

Real-world consequences of not having split sheets:
â€¢ Metro Boomin vs. Future lawsuit over "Mask Off" (settled for millions)
â€¢ Drake vs. Detail dispute over "Fake Love"
â€¢ Countless independent artists losing tens of thousands

**When to Create Split Sheets:**
âœ… Immediately after the writing session
âœ… BEFORE the song is released
âœ… BEFORE anyone registers the copyright
âœ… While everyone is still friendly

**What Happens Without One:**
â€¢ Default: Equal split among all writers (could be 1/5 instead of your agreed 1/2)
â€¢ Costly legal battles to prove your contribution
â€¢ Delayed releases while disputes are resolved
â€¢ Potential loss of your work entirely
â€¢ Destroyed professional relationships

**The Golden Rule:**
"No split sheet, no song release."
Insist on this EVERY TIME you co-write.`
        },
        {
          heading: 'Split Sheet Template',
          content: `**SONG SPLIT SHEET AGREEMENT**

**Song Information:**
â€¢ Song Title: _______________________
â€¢ Date Written: _______________________
â€¢ Location: _______________________
â€¢ Total Length: ________ minutes

**Writers & Publishers:**

Writer 1:
â€¢ Legal Name: _______________________
â€¢ Stage Name: _______________________
â€¢ Role: â–¡ Lyrics â–¡ Music â–¡ Both
â€¢ Ownership %: ________%
â€¢ Email: _______________________
â€¢ Phone: _______________________
â€¢ PRO: â–¡ ASCAP â–¡ BMI â–¡ SESAC  Member ID: __________
â€¢ Publisher (if any): _______________________
â€¢ IPI/CAE #: _______________________

Writer 2:
â€¢ Legal Name: _______________________
â€¢ Stage Name: _______________________
â€¢ Role: â–¡ Lyrics â–¡ Music â–¡ Both
â€¢ Ownership %: ________%
â€¢ Email: _______________________
â€¢ Phone: _______________________
â€¢ PRO: â–¡ ASCAP â–¡ BMI â–¡ SESAC  Member ID: __________
â€¢ Publisher (if any): _______________________
â€¢ IPI/CAE #: _______________________

[Add additional writers as neededâ€"total must equal 100%]

**Producer Credits (Sound Recording):**
â€¢ Producer Name: _______________________
â€¢ Producer %: ________% (of master recording)
â€¢ Producer Fee: $________ (if applicable)
â€¢ Advance Recoupable: â–¡ Yes â–¡ No

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
â€¢ Writer: 50% composition
â€¢ Producer: 50% composition (if they contributed melodically/harmonically)
â€¢ Producer: 2-5% of master recording (or flat fee)

**Two Writers, One Producer:**
â€¢ Writers: 25% each (50% total)
â€¢ Producer: 50% composition
â€¢ OR: Writers 50% each, producer gets flat fee + master points

**Full Band Session:**
â€¢ Equal splits (everyone gets 25% if 4 people)
â€¢ OR: Based on actual contribution

**What "Counts" as Writing:**

âœ… **Does Count:**
â€¢ Writing lyrics
â€¢ Creating melodies
â€¢ Chord progressions
â€¢ Song structure/arrangement
â€¢ Topline melodies
â€¢ Hook/chorus concepts

âŒ **Doesn't Count (typically):**
â€¢ Engineering/recording
â€¢ Mixing or mastering
â€¢ Playing an instrument (unless also writing)
â€¢ Being in the room
â€¢ Emotional support
â€¢ Ordering food

**Negotiation Tips:**

**For Producers:**
â€¢ If you created the beat from scratch: 33-50%
â€¢ If you used a sample pack loop: 15-25%
â€¢ If you just mixed: 0% (get paid for mixing separately)

**For Lyricists:**
â€¢ Wrote all lyrics + melody: 50%+
â€¢ Wrote only lyrics: 25-40%
â€¢ Wrote hook only: 20-30%

**For Melody Writers:**
â€¢ Original melody + harmony: 40-60%
â€¢ Melody only: 30-40%

**Red Flags:**
ðŸš© Someone wants 50%+ but contributed <20%
ðŸš© "Let's figure it out later" (NOâ€"do it NOW)
ðŸš© Pressure to sign without reading
ðŸš© Someone refuses to sign a split sheet

**Conflict Resolution:**
If you can't agree:
â€¢ Use a neutral mediator
â€¢ Base it on time spent on each element
â€¢ Consider future collaboration value
â€¢ Walk away if necessaryâ€"protect yourself`
        },
        {
          heading: 'Registering Your Split Sheet',
          content: `**After Everyone Signs:**

**Step 1: Each Writer Registers with Their PRO**
â€¢ ASCAP: ascap.com (register the song + your share)
â€¢ BMI: bmi.com (register the song + your share)
â€¢ SESAC: sesac.com (invitation-only, contact them)

**Information Needed:**
â€¢ Song title
â€¢ Your percentage
â€¢ Co-writers' names and PROs
â€¢ ISWC (International Standard Musical Work Code) if assigned

**Step 2: Register Copyright**
â€¢ One person files (usually the lead writer)
â€¢ Attach the split sheet to the application
â€¢ List all writers and percentages
â€¢ Each writer listed becomes a copyright claimant

**Step 3: Distribute Copies**
â€¢ Every writer gets a signed copy
â€¢ Keep PDF backup in the cloud
â€¢ Include with master recordings
â€¢ Provide to label/distributor if signed

**Step 4: Update Your Records**
â€¢ Store in Project Hub
â€¢ Add to personal database
â€¢ Tag with release date
â€¢ Link to final master file

**Digital Split Sheet Tools:**
â€¢ Lyric splits: online platform for splits
â€¢ Songtrust: split sheet + publishing admin
â€¢ TuneRegistry: blockchain-verified splits
â€¢ Studio Agents: integrated split sheet management (coming soon)

**Legal Enforceability:**
Split sheets are legal contracts if:
âœ… All parties are 18+ (or have guardian signature)
âœ… All parties signed willingly
âœ… All parties received a copy
âœ… Terms are clear and specific
âœ… Total percentages = 100%

**If Someone Won't Sign:**
â€¢ Don't release the song
â€¢ Don't register the copyright
â€¢ Don't invest more time/money
â€¢ Walk away if necessary

Your protection is worth more than one song.`
        },
        {
          heading: 'Advanced Split Scenarios',
          content: `**Samples & Interpolations:**

**If You Sample:**
â€¢ Original song owners get 50-100% of your new composition
â€¢ Negotiate BEFORE creatingâ€"most decline or want majority
â€¢ Budget for clearance: $5,000-$100,000+

**If You Interpolate (Re-sing/play):**
â€¢ Original songwriters get their % of your new composition (typically 25-50%)
â€¢ You don't need master clearance (you're re-recording)
â€¢ Still need publishing clearanceâ€"cheaper than sampling

**Example:**
You write new lyrics over a re-sung melody from "Hotline Bling":
â€¢ Drake's team: 50% of your composition
â€¢ You: 50% of your composition

**Work for Hire Situations:**

**You're Hired to Write:**
â€¢ You get 0% ownership
â€¢ You get a flat fee instead
â€¢ Must sign work-for-hire agreement
â€¢ They own copyright entirely

**You Hire Someone:**
â€¢ They get 0% ownership
â€¢ Pay them a fair fee upfront
â€¢ Have them sign work-for-hire agreement
â€¢ You own 100% copyright

**Example Rates:**
â€¢ Session writer: $500-$5,000 per song
â€¢ Producer: $1,000-$10,000+ per track
â€¢ Top-tier: $25,000-$100,000+

**Ghost Writing:**
â€¢ You write, someone else takes credit
â€¢ No ownership, no royalties
â€¢ Flat fee only (negotiate high)
â€¢ NDA usually required
â€¢ Common in pop, hip-hop, EDM

**Publishing Deals:**

**If You Have a Publisher:**
â€¢ You still own your writer's share (50% of composition)
â€¢ Publisher owns publisher's share (other 50%)
â€¢ Split sheet shows you as writer, your publisher as publisher
â€¢ You still get paidâ€"publisher collects and pays you

**Co-Publishing:**
â€¢ You keep 75% (your 50% writer + 25% publisher)
â€¢ Publisher gets 25%
â€¢ More favorable deal

**International Collaborations:**

**Writers in Different Countries:**
â€¢ Each registers with their local PRO
â€¢ PROs handle international collection
â€¢ Split sheet still required
â€¢ Use universal terms (percentages, not specific amounts)

**Currency & Payment:**
â€¢ PROs handle currency conversion
â€¢ You receive payment in your local currency
â€¢ May take 12-18 months for international royalties to arrive

**Language Adaptations:**
â€¢ New lyrics in another language = new copyright work
â€¢ Original writers get % of adaptation
â€¢ Adapter gets % for their lyrics
â€¢ Negotiate clearly: 50/50 or 70/30 typical`
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
          content: `"Sync" (synchronization) licensing is permission to use your music in visual media:
â€¢ TV shows and films
â€¢ Commercials and ads
â€¢ Video games
â€¢ Trailers and promos
â€¢ YouTube videos and social media content
â€¢ Corporate videos and presentations

**Why Sync is Lucrative:**

ðŸ'° **Payment Range:**
â€¢ YouTube video: $50-$500
â€¢ Indie film: $500-$5,000
â€¢ Network TV episode: $2,500-$15,000
â€¢ Cable TV show: $1,000-$5,000
â€¢ National commercial: $25,000-$500,000+
â€¢ Major film: $15,000-$100,000+
â€¢ Video game: $5,000-$50,000+

Plus you keep:
â€¢ Ongoing performance royalties every time it airs
â€¢ Streaming residuals
â€¢ International broadcast royalties

**Real Example:**
"Dog Days Are Over" by Florence + The Machine in commercials:
â€¢ Multiple sync fees: ~$500,000 total
â€¢ Performance royalties: ~$200,000+/year
â€¢ Career exposure: Invaluable

**The Two Licenses Required:**

1. **Synchronization License** (composition/publishing)
   - Permission to use the song (melody, lyrics, composition)
   - Negotiated with songwriter or publisher

2. **Master Use License** (recording)
   - Permission to use the specific recording
   - Negotiated with recording owner (artist, label, or producer)

**If you wrote AND recorded it yourself:**
You control both licensesâ€"negotiate both fees.`
        },
        {
          heading: 'How to Get Sync Placements',
          content: `**Route 1: Sync Licensing Agencies**

Submit your music to agencies that pitch to music supervisors:

**Top Sync Agencies:**
â€¢ **Musicbed** - High-end film/TV/commercial
â€¢ **Artlist** - Subscription model, steady income
â€¢ **Epidemic Sound** - YouTube/social media focus
â€¢ **Marmoset** - Boutique, selective
â€¢ **AudioSocket** - Broad catalog
â€¢ **Music Vine** - Emerging artists

**Pros:**
âœ… They handle all negotiations
âœ… Established supervisor relationships
âœ… Regular payment
âœ… Global opportunities

**Cons:**
âŒ Non-exclusive can limit big placements
âŒ Lower fees (you split with agency)
âŒ High competition in catalog

**Route 2: Direct to Music Supervisors**

Build relationships with the people who place music:

**Where to Find Them:**
â€¢ IMDb Pro (credits for TV shows/films)
â€¢ Guild of Music Supervisors directory
â€¢ LinkedIn (search "music supervisor")
â€¢ Industry events (SXSW, Sundance, etc.)

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

"Song Title" - [Genre] - [Mood] - [BPM] - [Duration]
[Streaming Link]

Instrumental available, fully cleared, master + publishing controlled.

Quick question: What upcoming projects are you sourcing for?

Best,
[Your Name]
[Website] | [Phone]

**Route 3: Sync Licensing Platforms**

**Syncr (sync. .com):**
â€¢ Upload your catalog
â€¢ Supervisors search and license directly
â€¢ You set your prices
â€¢ Platform takes 30%

**SongTradr:**
â€¢ Global marketplace
â€¢ AI-powered matching
â€¢ Brief notifications
â€¢ Professional network

**Songfinch:**
â€¢ Custom song commissions
â€¢ Great for building sync portfolio
â€¢ Steady income potential

**Route 4: YouTube & Social Media**

Don't overlook micro-licensing:

**Platforms:**
â€¢ **Lickd** - YouTube creator licensing
â€¢ **Epidemic Sound** - Subscription for creators
â€¢ **Artlist** - Popular with video creators

Thousands of small licenses = significant income.`
        },
        {
          heading: 'Creating "Sync-Friendly" Music',
          content: `**What Music Supervisors Look For:**

**Technical Requirements:**
âœ… **Clean/Instrumental versions** - Essential
âœ… **High-quality recording** - Professional mix/master
âœ… **Stems available** - Separate tracks for flexibility
âœ… **Multiple lengths** - :30, :60, full length
âœ… **Clear ownership** - No samples, no clearance issues

**Content Guidelines:**

**Best for Sync:**
â€¢ Universal themes (love, journey, triumph, loss)
â€¢ Clear but not overly specific lyrics
â€¢ Emotional without being cheesy
â€¢ Current production style
â€¢ Moderate BPM (80-130)

**Avoid:**
â€¢ Explicit language
â€¢ Brand name mentions
â€¢ Highly specific references
â€¢ Overly political content
â€¢ Dark/disturbing themes (limited use)

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
â€¢ BPM
â€¢ Key
â€¢ Mood tags (uplifting, melancholic, energetic)
â€¢ Instrumentation
â€¢ Vocal/instrumental
â€¢ Genre/subgenre
â€¢ Era/decade feel
â€¢ Cultural context

Music supervisors search by these termsâ€"tag accurately.`
        },
        {
          heading: 'Negotiating Sync Deals',
          content: `**Understanding the Offer:**

**Typical Deal Points:**

1. **Term**
   â€¢ Perpetuity (forever) vs. limited (1-5 years)
   â€¢ Perpetuity pays more upfront, limited can re-license later

2. **Territory**
   â€¢ Worldwide, US only, or specific regions
   â€¢ Worldwide = higher fee

3. **Media**
   â€¢ All media vs. TV only, film only, etc.
   â€¢ Broader rights = higher fee

4. **Exclusivity**
   â€¢ Can the same music be used elsewhere?
   â€¢ Exclusive = much higher fee

5. **Usage**
   â€¢ Background, featured, theme song
   â€¢ How many episodes/scenes
   â€¢ Featured/theme = higher fee

**Fee Negotiation:**

**Starting Points (US Network TV):**
â€¢ Background use, one episode: $2,500-$5,000
â€¢ Featured use, one episode: $5,000-$15,000
â€¢ Theme song, one season: $50,000-$200,000

**Your Negotiating Power Depends On:**
â€¢ Your track's uniqueness
â€¢ Budget of the project
â€¢ How badly they want YOUR song
â€¢ Timeline pressure (last-minute = higher fee)
â€¢ Your willingness to walk away

**Negotiation Email Template:**

*Thank you for considering "[Song]" for [Project]. I'm excited about this opportunity.*

*My standard rate for [usage type] in [media type] with [territory] rights is $[X].*

*Given [specific reason: tight budget, emerging artist, portfolio building], I can offer $[Y] for this placement.*

*This includes both master and sync licenses, instrumental version, and [any extras].*

*Would this work within your budget?*

**Counter-Offer Strategy:**
â€¢ They offer $1,000, you wanted $5,000
â€¢ Counter at $3,500 with justification
â€¢ Meet in the middle: $2,000-$2,500
â€¢ Know your minimumâ€"be willing to walk

**Red Flags:**
ðŸš© "Exposure only" (no payment)
ðŸš© Requesting 100% ownership transfer
ðŸš© Perpetuity worldwide exclusivity for low fee
ðŸš© No written agreement
ðŸš© Vague usage terms

**Contract Checklist:**
âœ… Fee amount and payment schedule
âœ… Usage details (how, where, when)
âœ… Territory and term specified
âœ… Credit terms (if applicable)
âœ… Performance royalty rights retained
âœ… Option to license elsewhere (if non-exclusive)
âœ… Approval rights (for edits/changes)`
        },
        {
          heading: 'After the Placement',
          content: `**Maximizing Your Sync Success:**

**1. Register with Your PRO**
â€¢ File cue sheet information
â€¢ Track title, duration, usage type
â€¢ This ensures you get performance royalties

**2. Collect Performance Royalties**
Every time your sync airs on TV:
â€¢ Your PRO tracks broadcasts
â€¢ You earn per airing
â€¢ Can add up to more than the original sync fee

**Example:**
$5,000 sync fee for one episode
+ $250 per broadcast
Ã- 10 airings (original + reruns)
+ International broadcasts
= $7,500-$15,000 total

**3. Promote the Placement**
â€¢ Share on social media (with permission)
â€¢ Update your website/EPK
â€¢ Mention in pitches to other supervisors
â€¢ Add to your Sync Resume

**4. Build the Relationship**
â€¢ Thank the music supervisor
â€¢ Ask for feedback
â€¢ Keep them updated on new releases
â€¢ Don't be pushyâ€"be professional

**5. Track Your Success**
Create a Sync Database:
â€¢ Project name, date, fee
â€¢ Supervisor contact
â€¢ Contract terms
â€¢ Payment status
â€¢ Performance royalty tracking

**Long-Term Sync Career:**

**Year 1-2: Portfolio Building**
â€¢ Accept lower fees for credits
â€¢ Build relationships
â€¢ Learn what works
â€¢ Goal: 5-10 placements

**Year 3-5: Established**
â€¢ Command higher fees
â€¢ Selective about projects
â€¢ Repeat clients
â€¢ Goal: $20,000-$50,000/year

**Year 5+: Successful Sync Career**
â€¢ Known by supervisors
â€¢ Regular placements
â€¢ Strategic high-value deals
â€¢ Goal: $50,000-$200,000+/year

**Success Story:**
ZZ Ward: Indie blues artist
â€¢ 30+ sync placements in 5 years
â€¢ Featured in "Suits," "Hart of Dixie," Walmart commercials
â€¢ Sync income: $300,000+ estimated
â€¢ Launched her touring career through exposure

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
          content: `Music publishing is the business of protecting and monetizing musical compositions (the songs themselvesâ€"not recordings).

**The Two Halves of a Composition:**

**1. Writer's Share (50%)**
â€¢ Belongs to the songwriter(s)
â€¢ Paid directly to you
â€¢ Cannot be sold or signed away
â€¢ Collected by your PRO

**2. Publisher's Share (50%)**
â€¢ Can be kept by you (self-published)
â€¢ Or assigned to a publishing company
â€¢ Handles administration, licensing, collection
â€¢ Split between you and publisher if signed

**Example:**
Your song earns $10,000 in royalties:
â€¢ $5,000 goes to writer's share â†' You
â€¢ $5,000 goes to publisher's share â†' You (if self-published) OR you + publisher (if signed)

**What Publishers Actually Do:**

**Administration Publishing (10-25% commission):**
â€¢ Register your songs worldwide
â€¢ Collect royalties from all sources
â€¢ Handle licensing paperwork
â€¢ Audit companies to ensure payment
â€¢ YOU retain ownership

**Traditional Publishing Deal (50% of publisher's share):**
â€¢ They own 50% of publisher's share (or more)
â€¢ Provide advance payment
â€¢ Actively pitch your songs
â€¢ Fund demos and recordings
â€¢ Career development

**Co-Publishing Deal (Most common for established artists):**
â€¢ Split publisher's share 50/50
â€¢ You get: 50% writer + 25% publisher = 75% total
â€¢ They get: 25% of publisher's share
â€¢ Balance of benefits and ownership`
        },
        {
          heading: 'Types of Publishing Royalties',
          content: `**1. Performance Royalties**

Earned when your song is performed publicly:
â€¢ Radio (AM/FM, satellite, internet)
â€¢ TV broadcasts
â€¢ Streaming (Spotify, Apple Music, etc.)
â€¢ Live venues (concerts, bars, restaurants)
â€¢ Background music (stores, offices)

**How It Works:**
â€¢ Collected by PROs (ASCAP, BMI, SESAC)
â€¢ Venues/platforms pay blanket licenses
â€¢ PROs distribute to songwriters
â€¢ You must be registered with a PRO

**Payment Timeline:**
â€¢ Quarterly distributions
â€¢ 6-12 month lag from performance to payment

**Typical Earnings:**
â€¢ 1 million Spotify streams: ~$500-$800 in performance royalties
â€¢ Local radio play: $50-$500 per play (varies by market)
â€¢ National TV show: $1,000-$5,000+ per episode

**2. Mechanical Royalties**

Earned when your song is reproduced:
â€¢ Physical CD/vinyl sales
â€¢ Digital downloads (iTunes, etc.)
â€¢ Interactive streams (Spotify, Apple Music)

**US Statutory Rate (2025):**
â€¢ Physical/download: 12.4Â¢ per copy (songs <5 min)
â€¢ Streaming: $0.006-$0.01 per stream (complicated formula)

**Who Collects:**
â€¢ US: Mechanical Licensing Collective (MLC) for streaming
â€¢ US: Harry Fox Agency for physical/downloads
â€¢ International: Local mechanical rights societies

**You Must:**
â€¢ Register with The MLC (free at themlc.com)
â€¢ Join Harry Fox or use a distributor
â€¢ Provide correct metadata to streaming platforms

**3. Synchronization Royalties** (Covered earlier)
â€¢ TV, film, commercials, video games
â€¢ Negotiated per use
â€¢ One-time fees + ongoing performance royalties

**4. Print Royalties**
â€¢ Sheet music sales
â€¢ Lyric books
â€¢ Guitar tabs

**Earnings:**
â€¢ 10-20% of retail price
â€¢ Niche but can add up

**5. Micro-Sync / Digital Performance**
â€¢ YouTube Content ID
â€¢ Social media uses (TikTok, Instagram)
â€¢ Video game integrations
â€¢ Ringtones (yes, still a thing)

**Collected by:**
â€¢ Publishing administrator
â€¢ YouTube via Content ID
â€¢ Direct licensing platforms

**Total Potential Income Sources:**
A successful song can earn from 15+ different royalty streams simultaneously.`
        },
        {
          heading: 'DIY Publishing: Keep 100%',
          content: `**Step 1: Create Your Own Publishing Company**

**Why:**
â€¢ Collect 100% of royalties (both writer & publisher shares)
â€¢ Professional presentation
â€¢ Tax benefits
â€¢ Ownership and control

**How to Set Up:**

**1. Choose a Company Name**
â€¢ Can't be same as existing publisher (check ASCAP/BMI databases)
â€¢ Often [Your Name] Music, [Your Name] Publishing
â€¢ Examples: "Luna Records Publishing," "Skyline Songs"

**2. Register as a Business**
â€¢ LLC recommended ($50-$500 depending on state)
â€¢ Sole proprietorship works too (simpler, less protection)
â€¢ Get EIN from IRS (free, online)

**3. Affiliate with a PRO**
â€¢ ASCAP, BMI, or SESAC
â€¢ Register yourself as "writer"
â€¢ Register your publishing company as "publisher"
â€¢ Costs: $0-$150 depending on PRO

**4. Open Publishing Bank Account**
â€¢ Separate from personal finances
â€¢ Track publishing income
â€¢ Easier taxes and accounting

**Step 2: Register Your Songs**

**With Your PRO:**
â€¢ Song title
â€¢ Writers and percentages
â€¢ Your publishing company name
â€¢ Do this BEFORE release

**With Mechanical Licensing Collective:**
â€¢ themlc.com (free)
â€¢ Ensures streaming mechanical royalty collection
â€¢ Required for US streaming income

**With Copyright Office:**
â€¢ Optional but recommended
â€¢ Strengthens legal protection
â€¢ One-time $65 fee

**Step 3: Distribute with Publishing Admin**

**Option A: Full DIY** (100% royalties, more work)
â€¢ Register with every collection society globally (20+ countries)
â€¢ Monitor and track usage yourself
â€¢ File claims manually
â€¢ Best if: Low volume, specific territories

**Option B: Publishing Administrator** (85-90% royalties, less work)

**Top Admin Services:**
â€¢ **Songtrust**: $100/year + 15% commission
â€¢ **CD Baby Pro**: $30-$70/year + small commission
â€¢ **TuneCore Publishing**: $75/year + 20% commission
â€¢ **Sentric Music**: Free + 20% commission (UK-based)

**What They Do:**
âœ… Register your songs in 100+ territories
âœ… Collect from 60+ collection societies
âœ… YouTube Content ID management
âœ… Sync licensing opportunities
âœ… Royalty tracking dashboard
âœ… Audit services

**Option C: Hybrid**
â€¢ Use administrator for collection
â€¢ Handle sync licensing yourself
â€¢ Best of both worlds

**Recommendation:**
If you're serious about music career, use an administrator. The 10-15% commission is worth the global collection and time saved.`
        },
        {
          heading: 'Understanding PROs',
          content: `**Performance Rights Organizations (PROs):**

**ASCAP (American Society of Composers, Authors and Publishers)**
â€¢ Non-profit
â€¢ Member-owned (you get voting rights)
â€¢ 850,000+ members
â€¢ Costs: Writer $50, Publisher $50
â€¢ Payment: Quarterly
â€¢ Best for: Traditional songwriters, established artists

**BMI (Broadcast Music, Inc.)**
â€¢ For-profit (but treats members fairly)
â€¢ Free to join (writer & publisher)
â€¢ 1.1 million+ members
â€¢ Payment: Quarterly
â€¢ Best for: Anyone, especially starting out (no fees)

**SESAC (Society of European Stage Authors & Composers)**
â€¢ For-profit, selective (invitation only)
â€¢ Smaller (30,000+ members)
â€¢ Higher per-play rates
â€¢ Payment: Quarterly
â€¢ Best for: Established writers, specific genres

**Global Music Rights (GMR)**
â€¢ Boutique, invitation-only
â€¢ For high-value catalogs
â€¢ Negotiates higher rates
â€¢ Best for: Hits and major placements

**Which Should You Choose?**

**Choose based on:**
â€¢ Cost (BMI is free)
â€¢ Genre representation (ASCAP strong in film/TV, BMI in pop/hip-hop)
â€¢ Advances (some PROs offer advances to established writers)
â€¢ Personal connection (who responds to your questions?)

**You Can Only Join ONE PRO** (per country)
â€¢ You can't switch easily (2-year commitment typically)
â€¢ Your publishing company can be with a different PRO than you as a writer
â€¢ Example: You as writer with ASCAP, your publishing company with BMI

**What Your PRO Does:**

âœ… Licenses venues, radio, streaming services
âœ… Monitors where your music is performed
âœ… Distributes royalties to you
âœ… Advocates for songwriter rights
âœ… Provides legal resources

âŒ Does NOT:
â€¢ Collect mechanical royalties (that's MLC/Harry Fox)
â€¢ Handle sync licensing (that's you or your publisher)
â€¢ Promote your music
â€¢ Get you placements

**Registering Your Songs:**

**Required Information:**
â€¢ Song title
â€¢ Writers (you + any co-writers with their PROs)
â€¢ Publishers (your company name)
â€¢ Ownership percentages
â€¢ ISWC (if you have one)

**Do This:**
â€¢ Register BEFORE release
â€¢ Update after any changes
â€¢ Register every song, even demos
â€¢ Keep your contact info current

**Checking Your Royalties:**
â€¢ Log in quarterly
â€¢ Review usage reports
â€¢ Flag any missing plays
â€¢ File disputes if needed

**Average Royalty Examples:**
â€¢ Local radio (top 50 market): $200-$400 per play
â€¢ National radio (top 10 market): $500-$1,000+ per play
â€¢ Cable TV background use: $20-$100 per 30 seconds
â€¢ Streaming (1 million plays): $500-$800 total
â€¢ Coffee shop background: $0.01-$0.05 per play (adds up!)

**Pro Tip:**
Set aside 30% of your publishing income for taxes. Royalties are self-employment income.`
        },
        {
          heading: 'International Collection',
          content: `**The Challenge:**

Your song streams in 200+ countries. Each country has its own collection society. Without representation, you're leaving money on the table.

**Collection Societies by Territory:**

**Europe:**
â€¢ UK: PRS for Music
â€¢ Germany: GEMA
â€¢ France: SACEM
â€¢ Spain: SGAE
â€¢ Scandinavia: STIM (Sweden), TONO (Norway), KODA (Denmark)

**Asia:**
â€¢ Japan: JASRAC
â€¢ South Korea: KOMCA
â€¢ China: MCSC
â€¢ India: IPRS

**Latin America:**
â€¢ Brazil: ECAD
â€¢ Mexico: SACM
â€¢ Argentina: SADAIC

**Other:**
â€¢ Canada: SOCAN
â€¢ Australia: APRA AMCOS
â€¢ South Africa: SAMRO

**How International Collection Works:**

**Without Publisher/Admin:**
â€¢ Your US PRO has reciprocal agreements
â€¢ They collect international on your behalf
â€¢ But: Can take 2-3 years and lose 20-40% in fees

**With Publishing Administrator:**
â€¢ They register directly with each society
â€¢ Faster collection (6-12 months)
â€¢ Higher royalty capture (5-15% more)
â€¢ One login to see global earnings

**Black Box Royalties:**

"Black box" = unclaimed royalties sitting in collection societies.

**Why It Happens:**
â€¢ Incomplete metadata
â€¢ Unregistered songs
â€¢ Writers not affiliated with societies
â€¢ Spelling errors in credits

**Estimated unclaimed royalties globally: $1-2 BILLION/year**

**How to Claim Your Share:**
1. Register with global admin (Songtrust, CD Baby Pro, etc.)
2. Ensure accurate metadata on all releases
3. Register songs before release
4. File claims for past releases (can go back 3 years typically)

**Metadata Checklist:**
âœ… Songwriter legal names (spelled correctly)
âœ… PRO affiliations
âœ… IPI/CAE numbers
âœ… Publisher names
âœ… ISWC codes
âœ… Consistent song title spelling

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
              <span>ðŸ"– {selectedResource.readTime} read</span>
              <span>â€¢</span>
              <span>{selectedResource.sections.length} sections</span>
              <span>â€¢</span>
              <span style={{ color: selectedResource.color }}>âš¡ Action Items Included</span>
            </div>
          </div>

          {/* Sections */}
          {selectedResource.sections.map((section, idx) => (
            <div key={idx} style={{
              marginBottom: '48px'
            }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                marginBottom: '20px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${selectedResource.color}20`,
                  color: selectedResource.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '700'
                }}>
                  {idx + 1}
                </span>
                {section.heading}
              </h2>
              <div style={{
                fontSize: '1rem',
                lineHeight: '1.8',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-line'
              }}>
                {section.content}
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
          gap: '24px'
        }}>
          {legalResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.id}
                className="resource-card haptic-press"
                onClick={() => setSelectedResource(resource)}
                style={{
                  padding: '28px',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '4px 10px',
                  background: `${resource.color}20`,
                  color: resource.color,
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {resource.readTime}
                </div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: `${resource.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <Icon size={28} style={{ color: resource.color }} />
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: resource.color,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  {resource.category}
                </div>
                <h4 style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  marginBottom: '12px',
                  lineHeight: '1.3'
                }}>
                  {resource.title}
                </h4>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  marginBottom: '20px'
                }}>
                  {resource.summary}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: resource.color,
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Read {resource.type}
                  <ChevronRight size={16} />
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
              ðŸ"… Office Hours Schedule
            </button>
            <button
              className="cta-button-premium haptic-press"
              style={{
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              ðŸ" Download Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalResourcesPage;
