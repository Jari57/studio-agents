import fs from 'node:fs';
import path from 'node:path';

const serverPath = path.resolve('/app/backend/server.js');
const source = fs.readFileSync(serverPath, 'utf8');

const previous = `    // Engine Selection Logic - Always prefer Stability AI for highest quality
    let finalEngine = engine;
    if (engine === 'auto' || !engine || engine === 'music-gpt') {
      if (stabilityKey) {
        finalEngine = 'stability';
      } else {
        finalEngine = 'music-gpt';
      }
    }
`;

const replacement = `    // Provider-aware engine selection. A configured Stability key is not enough:
    // an account with zero balance used to hold every customer request for a full
    // provider timeout before falling back to MiniMax. Cache a fast balance probe
    // and skip the unavailable provider before starting paid generation work.
    let stabilityUsable = false;
    if (stabilityKey) {
      const cached = globalThis.__studioStabilityAudioAvailability;
      if (cached && Date.now() - cached.checkedAt < 5 * 60 * 1000) {
        stabilityUsable = cached.usable;
      } else {
        try {
          const balanceResponse = await fetch('https://api.stability.ai/v1/user/balance', {
            headers: { Authorization: \\`Bearer \\${stabilityKey}\\`, Accept: 'application/json' },
            signal: AbortSignal.timeout(3000)
          });
          const balancePayload = await balanceResponse.json().catch(() => ({}));
          stabilityUsable = balanceResponse.ok && Number(balancePayload.credits) > 0;
          globalThis.__studioStabilityAudioAvailability = {
            checkedAt: Date.now(),
            usable: stabilityUsable,
            status: balanceResponse.status
          };
          if (!stabilityUsable) {
            logger.warn('Stability audio skipped before generation', {
              status: balanceResponse.status,
              reason: balanceResponse.ok ? 'no-positive-credit-balance' : 'balance-check-failed'
            });
          }
        } catch (availabilityError) {
          globalThis.__studioStabilityAudioAvailability = {
            checkedAt: Date.now(),
            usable: false,
            status: 0
          };
          logger.warn('Stability audio availability check failed; using another provider', {
            error: availabilityError.message
          });
        }
      }
    }

    let finalEngine = engine;
    if (engine === 'auto' || !engine || engine === 'music-gpt') {
      finalEngine = stabilityUsable ? 'stability' : 'music-gpt';
    } else if (engine === 'stability' && !stabilityUsable) {
      finalEngine = 'music-gpt';
    }
`;

const occurrences = source.split(previous).length - 1;
if (occurrences < 1) {
  console.error('Could not find the Studio audio engine-selection contract.');
  process.exit(1);
}

const patched = source.split(previous).join(replacement);
if (!patched.includes('__studioStabilityAudioAvailability')) {
  console.error('Provider routing patch did not apply.');
  process.exit(1);
}

fs.writeFileSync(serverPath, patched);
console.log(`Provider-aware beat routing applied to ${occurrences} route occurrence(s).`);
