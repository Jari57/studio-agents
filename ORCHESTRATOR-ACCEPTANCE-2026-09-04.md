# StudioAgentsAI orchestrator repair acceptance

Scope: the 15 findings in the 2026-09-04 review. Code repairs and local regression checks are implemented. Live acceptance and artistic listening remain separate release gates; this is not certification.

| # | Finding | Current implementation | Required evidence |
|---|---|---|---|
| 1 | Singing incorrectly gated on speech clone | Separate server-owned singing reference preparation/approval; original MiniMax performer without a reference | Owned-sample generation and listening; account boundary tests |
| 2 | Weak MP3 preparation | Bounded storage reads, decode, explicit excerpt, silence/clipping checks, song-vocal separation, required listening approval | Real MP3 plus malformed/silent/clipped fixtures |
| 3 | Old beat paired with new vocal | Matching accompaniment from the same separation pass; performance ID | Route regression and listening |
| 4 | Destructive automatic timing/effects | Final-mix timing and cosmetic vocal effects opt-in, disabled by orchestrator | Real FFmpeg timing tests; inspect residual paths |
| 5 | Lyrics truncated/repeated | Remove 1500-character cut and personal-lyrics padding; explicit personal excerpt | Capacity boundary and submitted-text tests |
| 6 | Late reference analysis / unsupported controls | Analyze private references before generation; hide unsupported musical synth controls | Call-order tests and browser checks |
| 7 | Speech picker/fallback in song mode | Remove spoken fallback and automatic personal-to-studio substitution | UI consolidation and readiness regressions |
| 8 | Saved master points at beat | Master URL selected from rendered master, with explicit role metadata | Save/reopen test |
| 9 | Wrong producer lanes | Initialize from current vocal/beat, exclude masters; restore saved session | Initial-session tests and browser reopen |
| 10 | Missing controls and false saved status | Persist song settings/references/outputs/performance; local edits invalidate saved state | Clear/remove, concurrent save, reopen tests |
| 11 | Incomplete/incorrect exports | Atomic ZIP collection, actual MIME extensions, manifest, named failures | ZIP contents plus failed-fetch/conversion tests |
| 12 | Inconsistent completion | Shared selected-output counts across journey, collapsed hub, expanded hub and footer; text does not satisfy audio/art/video | Selected-output tests pass; fresh live job acceptance remains |
| 13 | Overflow and friction | Compact quick form; progressive voice/reference panel | Desktop/mobile keyboard and overflow checks |
| 14 | Reference trust / SSRF | Owned Storage bytes, protected consent records, DNS-pinned downloads; legacy speech authorization strengthened | Forged-record, source mismatch, redirects, timeout tests |
| 15 | Approximate preview misrepresented | Rendered-master player is authoritative; stem audition is labeled approximate; rejected playback is surfaced; mute/solo retained across reloads | Local UI and render checks pass; artist comparison remains |

## Local evidence

- Frontend: **169/169** dependency-free regression tests pass.
- Backend: **130/130** tests pass, including actual FFmpeg stem conversion and timing, malformed/silent/clipped excerpts, playlist rejection, DNS pinning, redirect revalidation, network interruption, deadline abort and complete-ZIP failure semantics.
- Actual song-route tests preserve the submitted lyrics, analyze references before inference and pair vocals with the newly generated accompaniment. Provider traffic in these tests is stubbed; it is not a paid-provider listening result.
- Actual save-wrapper regression checks the submitted master/settings snapshot and distinguishes a later unsaved edit. Removed references and explicitly cleared outputs remain cleared on restoration; prior takes/masters are retained.
- Individual and ZIP download tests reject missing, empty, expired and non-media responses. Filenames use returned MIME types; no silent partial download success.
- Production Vite build and backend prebuild/hardening/syntax checks pass locally. Docker now runs the entire backend regression suite rather than a selected subset. Local environment files are excluded from its image context.
- Browser checks: paper/charcoal modes; Quick/Advanced controls; Salsa/Bachata/Dembow selectors; 320, 390 and 831 CSS-pixel layouts without horizontal control overflow; sample preparation and excerpt controls; keyboard Tab from excerpt start to length. Browser viewport override was reset. These are emulated widths, not physical iOS/Android certification.
- New helpers/reference panel and preview mixer have no lint errors. The changed large legacy components were compared against HEAD: no new lint findings; the orchestrator retains 12 existing lint errors, so the repository is not being described as lint-clean.

## Release tracking

At this checkpoint, no production deployment or GitHub sync has been performed for this change set. Railway login was renewed for the coordinated release. The existing production frontend and backend remain at `673577eca8aa14463215199819951c8e313677e9`.

Preserve all existing projects, samples and takes. Do not change Firebase database selection or deploy new rules as part of this repair. Legacy speech-voice records that lack server-owned authorization must be revalidated through an owned sample; they are not silently trusted or deleted.

Still required: paired backend/frontend deployment and revision check; real original-performer song generation; authorized personal singing sample preparation and two-take listening; authenticated save/reopen/export/retry; real-device upload/playback; production two-account isolation smoke checks. No release-quality, voice-likeness, harmony or certification claim follows from a successful API response alone.

External listening gate: the user has been asked for an owned/permitted singing MP3. Automated audio checks cannot certify singer identity, voice likeness, harmony or release quality.
