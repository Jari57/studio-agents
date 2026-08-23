import { randomBytes } from 'node:crypto';

const baseUrl = (process.env.STUDIO_CANARY_BASE_URL || 'https://studioagentsai.com').replace(/\/$/, '');
const firebaseApiKey = process.env.STUDIO_FIREBASE_API_KEY || 'AIzaSyATzZmmJoABVEFYLro6ggpf_i9eoJ1eSfA';
const requestTimeoutMs = 150_000;
const routeWaitMs = 20 * 60_000;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(url, init = {}, timeoutMs = requestTimeoutMs) {
  const response = await fetch(url, {
    ...init,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'User-Agent': 'studio-paid-angry-customer-canary/1.0',
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let payload = null;
  try { payload = JSON.parse(text); } catch {}
  return { response, text, payload };
}

async function waitForAccountDeletionRoute() {
  const deadline = Date.now() + routeWaitMs;
  let lastStatus = null;
  while (Date.now() < deadline) {
    const { response } = await request(`${baseUrl}/api/user/account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: 'DELETE' }),
    }, 30_000).catch(() => ({ response: { status: 0 } }));
    lastStatus = response.status;
    if (response.status === 401) return;
    await sleep(15_000);
  }
  throw new Error(`Account deletion route was not deployed after ${routeWaitMs / 60_000} minutes; last status ${lastStatus}`);
}

async function firebaseRequest(action, body) {
  return request(
    `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${encodeURIComponent(firebaseApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    45_000,
  );
}

async function api(path, token, init = {}) {
  return request(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

async function getCredits(token) {
  const { response, payload, text } = await api('/api/user/credits', token);
  assert(response.status === 200, `Credit balance returned ${response.status}: ${text.slice(0, 300)}`);
  assert(Number.isFinite(Number(payload?.credits)), 'Credit balance did not contain a numeric credits value');
  return Number(payload.credits);
}

async function waitForCredits(token, expected, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let latest = null;
  while (Date.now() < deadline) {
    latest = await getCredits(token);
    if (latest === expected) return latest;
    await sleep(1_000);
  }
  throw new Error(`Expected ${expected} credits after settlement; latest balance ${latest}`);
}

async function deleteFirebaseIdentityFallback(idToken) {
  if (!idToken) return;
  await firebaseRequest('delete', { idToken }).catch(() => {});
}

async function main() {
  const startedAt = Date.now();
  const nonce = `${Date.now()}-${randomBytes(5).toString('hex')}`;
  const email = `studio-canary-${nonce}@example.com`;
  const password = `Canary-${randomBytes(18).toString('base64url')}!9a`;
  let idToken = null;
  let backendDeleted = false;
  const evidence = [];

  await waitForAccountDeletionRoute();
  evidence.push({ check: 'account-deletion-route', status: 'ready' });

  try {
    const signup = await firebaseRequest('signUp', {
      email,
      password,
      returnSecureToken: true,
    });
    assert(signup.response.status === 200, `Firebase canary signup returned ${signup.response.status}: ${signup.text.slice(0, 300)}`);
    idToken = signup.payload?.idToken;
    assert(idToken && signup.payload?.localId, 'Firebase signup did not return a disposable authenticated user');
    evidence.push({ check: 'firebase-signup', status: 'pass', user: signup.payload.localId.slice(0, 8) });

    const startingCredits = await getCredits(idToken);
    assert(startingCredits >= 1, `Canary account started with ${startingCredits} credits`);
    evidence.push({ check: 'starting-credit-balance', credits: startingCredits });

    const generationKey = `canary-text-${nonce}`;
    const generationBody = JSON.stringify({
      prompt: 'Write one original two-line chorus about rebuilding trust after a difficult release. Return only the chorus.',
      systemInstruction: 'Keep the response concise, original, and safe for a product canary.',
      model: 'auto',
      language: 'English',
    });
    const generationInit = {
      method: 'POST',
      headers: { 'Idempotency-Key': generationKey },
      body: generationBody,
    };

    const [first, duplicate] = await Promise.all([
      api('/api/generate', idToken, generationInit),
      api('/api/generate', idToken, generationInit),
    ]);
    const pair = [first, duplicate];
    const successes = pair.filter(({ response }) => response.status >= 200 && response.status < 300);
    const duplicateBlocks = pair.filter(({ response, payload }) => response.status === 409
      && ['GENERATION_ALREADY_IN_PROGRESS', 'IDEMPOTENT_REQUEST_COMPLETED'].includes(payload?.code));

    assert(successes.length === 1, `Expected one successful provider job; statuses ${pair.map(({ response }) => response.status).join(', ')}`);
    assert(duplicateBlocks.length === 1, `Expected one duplicate block; statuses ${pair.map(({ response }) => response.status).join(', ')}`);
    evidence.push({
      check: 'duplicate-submit',
      status: 'pass',
      responses: pair.map(({ response, payload }) => ({ status: response.status, code: payload?.code || null })),
    });

    const chargedBalance = await waitForCredits(idToken, startingCredits - 1, 45_000);
    evidence.push({ check: 'one-final-charge', credits: chargedBalance });

    const failureKey = `canary-invalid-${nonce}`;
    const failed = await api('/api/generate', idToken, {
      method: 'POST',
      headers: { 'Idempotency-Key': failureKey },
      body: JSON.stringify({}),
    });
    assert(failed.response.status === 400, `Invalid generation returned ${failed.response.status}, expected 400`);
    const refundedBalance = await waitForCredits(idToken, chargedBalance, 45_000);
    evidence.push({ check: 'failed-generation-refund', status: 'pass', credits: refundedBalance });

    const history = await api('/api/user/credits/history', idToken);
    assert(history.response.status === 200, `Credit history returned ${history.response.status}`);
    const transactions = Array.isArray(history.payload) ? history.payload : history.payload?.history;
    assert(Array.isArray(transactions), 'Credit history did not return a transaction array');
    const canaryTransactions = transactions.filter((entry) =>
      String(entry?.reservationId || '').length > 0
      || ['reserve', 'consume', 'refund'].includes(String(entry?.type || '').toLowerCase()));
    assert(canaryTransactions.length >= 3, `Expected reserve/consume/refund evidence; found ${canaryTransactions.length} records`);
    evidence.push({ check: 'durable-credit-history', records: canaryTransactions.length });

    const deletion = await api('/api/user/account', idToken, {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'DELETE' }),
    });
    assert(deletion.response.status === 200, `Complete account deletion returned ${deletion.response.status}: ${deletion.text.slice(0, 300)}`);
    assert(deletion.payload?.deleted === true, 'Account deletion did not confirm deletion');
    backendDeleted = true;
    evidence.push({ check: 'complete-account-deletion', status: 'pass' });

    const lookup = await firebaseRequest('lookup', { idToken });
    assert(lookup.response.status === 400, `Deleted Firebase identity still resolved with status ${lookup.response.status}`);
    const lookupError = String(lookup.payload?.error?.message || lookup.text || '');
    assert(/USER_NOT_FOUND|INVALID_ID_TOKEN|TOKEN_EXPIRED|USER_DISABLED/i.test(lookupError), `Unexpected post-deletion identity response: ${lookupError.slice(0, 200)}`);
    evidence.push({ check: 'identity-no-longer-resolves', status: 'pass' });

    console.log(JSON.stringify({
      ok: true,
      baseUrl,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      evidence,
    }, null, 2));
  } finally {
    if (!backendDeleted) await deleteFirebaseIdentityFallback(idToken);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    baseUrl,
    checkedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
});
