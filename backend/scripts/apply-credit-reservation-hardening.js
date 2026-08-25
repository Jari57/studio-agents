'use strict';

const fs = require('node:fs');
const path = require('node:path');

const serverPath = path.resolve(__dirname, '..', 'server.js');
const originalSource = fs.readFileSync(serverPath, 'utf8');
const usesCrLf = originalSource.includes('\r\n');
let source = originalSource.replace(/\r\n/g, '\n');

function countOccurrences(content, marker) {
  return content.split(marker).length - 1;
}

function replaceOnce(content, search, replacement, label) {
  const count = countOccurrences(content, search);
  if (count !== 1) {
    throw new Error(`${label}: expected one marker, found ${count}`);
  }
  return content.replace(search, replacement);
}

function replaceExactCount(content, search, replacement, expected, label) {
  const count = countOccurrences(content, search);
  if (count !== expected) {
    throw new Error(`${label}: expected ${expected} markers, found ${count}`);
  }
  return content.split(search).join(replacement);
}

function replaceBlock(content, startMarker, endMarker, replacement, label) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`${label}: block markers not found`);
  }
  if (content.indexOf(startMarker, start + startMarker.length) !== -1) {
    throw new Error(`${label}: start marker is not unique`);
  }
  return `${content.slice(0, start)}${replacement}${content.slice(end)}`;
}

const legacyStartMarker = 'const checkCreditsFor = (featureType) => {';
const legacyEndMarker = '// Fetch with timeout helper';
const serviceMarker = 'createCreditReservationService({';

const serviceWiring = `const { createCreditReservationService } = require('./services/creditReservation');
const {
  checkCreditsFor,
  refundCredits,
  reservationMetadataFor,
  settleDetachedReservation,
} = createCreditReservationService({
  getDb: getFirestoreDb,
  admin,
  getUserId: (req) => req.user?.uid || null,
  getUserEmail: (req) => req.user?.email || null,
  getCreditCost,
  shouldSkip: (req, featureType) => {
    if (!req.user) return 'anonymous-free-limit';
    if (ADMIN_EMAILS.includes((req.user.email || '').toLowerCase())) return 'admin';
    if (featureType === 'text' && req.body?.isBrainPhase === true) return 'brain-phase';
    return false;
  },
  logger,
});

// Legacy alias retained for routes that still use the default one-credit check.
const _checkCredits = checkCreditsFor('default');

`;

if (!source.includes(serviceMarker)) {
  source = replaceBlock(
    source,
    legacyStartMarker,
    legacyEndMarker,
    serviceWiring,
    'credit middleware replacement',
  );
}

if (!source.includes('...reservationMetadataFor(req)')) {
  for (const declaration of [
    'const veo3FastOp = {',
    'const veo2Op = {',
    'const replicateOp = {',
  ]) {
    source = replaceOnce(
      source,
      declaration,
      `${declaration}\n                  opId,`,
      `${declaration} operation identity`,
    );
  }

  const pendingMetadata = `                  userId: req.user?.uid || null,
                  userEmail: req.user?.email || '',
                  creditCharged: req.creditCharged || 0,
                  refunded: false`;
  const pendingMetadataWithReservation = `                  userId: req.user?.uid || null,
                  userEmail: req.user?.email || '',
                  ...reservationMetadataFor(req),
                  refunded: false`;
  source = replaceExactCount(
    source,
    pendingMetadata,
    pendingMetadataWithReservation,
    2,
    'Veo reservation metadata',
  );

  const replicateMetadata = `            userId: req.user?.uid || null,
            userEmail: req.user?.email || '',
            creditCharged: req.creditCharged || 0,
            refunded: false`;
  const replicateMetadataWithReservation = `            userId: req.user?.uid || null,
            userEmail: req.user?.email || '',
            ...reservationMetadataFor(req),
            refunded: false`;
  source = replaceOnce(
    source,
    replicateMetadata,
    replicateMetadataWithReservation,
    'Replicate reservation metadata',
  );

  const queuedMetadata = `        userId: req.user.uid,
        creditCharged: req.creditCharged || 0,
        featureType: req.featureType || 'video-synced',
        refunded: false,`;
  const queuedMetadataWithReservation = `        userId: req.user.uid,
        ...reservationMetadataFor(req),
        featureType: req.featureType || 'video-synced',
        refunded: false,`;
  source = replaceOnce(
    source,
    queuedMetadata,
    queuedMetadataWithReservation,
    'synced-video reservation metadata',
  );
}

if (!source.includes("settleDetachedReservation(op, 'refund'")) {
  const pendingRefundStart = 'async function refundPendingVideoOp(op, reason) {';
  const pendingRefundEnd = '// Keep generation prompts musical and achievable.';
  const pendingRefundReplacement = `async function refundPendingVideoOp(op, reason) {
  if (!op || op.refunded || !op.creditCharged || !op.userId) return false;

  if (op.creditReservationId) {
    const refunded = await settleDetachedReservation(op, 'refund', reason);
    if (refunded) {
      op.refunded = true;
      op.creditCharged = 0;
    }
    return refunded;
  }

  // Transitional fallback for a job created by the pre-reservation release.
  // The deterministic history ID makes this legacy refund idempotent.
  if (!firebaseInitialized) return false;
  const db = getFirestoreDb();
  if (!db) return false;
  const userRef = db.collection('users').doc(op.userId);
  const legacyId = String(op.opId || op.operationName || op.replicatePredictionId || 'unknown')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 180);
  const refundRef = userRef.collection('credit_history').doc(\`video-op-\${legacyId}\`);
  try {
    await db.runTransaction(async (transaction) => {
      const [userDoc, refundDoc] = await Promise.all([
        transaction.get(userRef),
        transaction.get(refundRef),
      ]);
      if (refundDoc.exists) return;
      const credits = userDoc.exists ? Number(userDoc.data().credits || 0) : 0;
      transaction.set(userRef, { credits: credits + op.creditCharged }, { merge: true });
      transaction.create(refundRef, {
        type: 'refund',
        amount: op.creditCharged,
        feature: 'video',
        reason,
        balanceBefore: credits,
        balanceAfter: credits + op.creditCharged,
        operationId: op.opId || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    op.refunded = true;
    op.creditCharged = 0;
    return true;
  } catch (error) {
    logger.error('Legacy pending-video credit refund failed', {
      operationId: op.opId || null,
      error: error.message,
    });
    return false;
  }
}

`;
  source = replaceBlock(
    source,
    pendingRefundStart,
    pendingRefundEnd,
    pendingRefundReplacement,
    'pending-video refund replacement',
  );
}

if (!source.includes("settleDetachedReservation(job, 'refund'")) {
  const syncedRefundStart = 'async function refundVideoJob(job, reason) {';
  const syncedRefundEnd = 'async function _restoreVideoJobs() {';
  const syncedRefundReplacement = `async function refundVideoJob(job, reason) {
  if (!job || job.refunded || !job.creditCharged || !job.userId || !firebaseInitialized) return false;

  if (job.creditReservationId) {
    const refunded = await settleDetachedReservation(job, 'refund', reason);
    if (refunded) {
      logger.info('Synced-video reservation refunded', { jobId: job.jobId, userId: job.userId, reason });
      job.refunded = true;
      job.creditCharged = 0;
    }
    return refunded;
  }

  // Transitional fallback for a queued job created before reservations shipped.
  const db = getFirestoreDb();
  if (!db) return false;
  const userRef = db.collection('users').doc(job.userId);
  const refundRef = userRef.collection('credit_history').doc(\`video-job-\${job.jobId}\`);
  try {
    await db.runTransaction(async (transaction) => {
      const [userDoc, refundDoc] = await Promise.all([
        transaction.get(userRef),
        transaction.get(refundRef),
      ]);
      if (refundDoc.exists) return;
      const credits = userDoc.exists ? Number(userDoc.data().credits || 0) : 0;
      transaction.set(userRef, { credits: credits + job.creditCharged }, { merge: true });
      transaction.create(refundRef, {
        type: 'refund',
        amount: job.creditCharged,
        feature: job.featureType || 'video-synced',
        reason,
        balanceBefore: credits,
        balanceAfter: credits + job.creditCharged,
        jobId: job.jobId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    logger.info('Legacy synced-video credits refunded', { jobId: job.jobId, userId: job.userId, reason });
    job.refunded = true;
    job.creditCharged = 0;
    return true;
  } catch (error) {
    logger.error('Legacy synced-video credit refund failed', { jobId: job.jobId, error: error.message });
    return false;
  }
}

`;
  source = replaceBlock(
    source,
    syncedRefundStart,
    syncedRefundEnd,
    syncedRefundReplacement,
    'synced-video refund replacement',
  );
}

if (!source.includes("await settleDetachedReservation(op, 'consume', 'asynchronous video generation completed');")) {
  const nestedCompletedMarker = "      op.status = 'completed';";
  source = replaceExactCount(
    source,
    nestedCompletedMarker,
    "      await settleDetachedReservation(op, 'consume', 'asynchronous video generation completed');\n      op.status = 'completed';",
    3,
    'nested asynchronous video consumption',
  );

  source = replaceOnce(
    source,
    "    op.status = 'completed';\n    op.result = { status: 'completed', output: result, type: 'video', source: op.source };",
    "    await settleDetachedReservation(op, 'consume', 'asynchronous video generation completed');\n    op.status = 'completed';\n    op.result = { status: 'completed', output: result, type: 'video', source: op.source };",
    'raw asynchronous video consumption',
  );
}

if (!source.includes("await settleDetachedReservation(completedJob, 'consume'")) {
  source = replaceOnce(
    source,
    '          videoJobs.set(jobId, completedJob);',
    "          await settleDetachedReservation(completedJob, 'consume', 'synced video generation completed');\n          videoJobs.set(jobId, completedJob);",
    'synced-video consumption',
  );
}

const terminalPollFailure = `    if (op.consecutiveErrors >= 5) {
      op.status = 'failed';
      op.error = \`Polling failed: \${err.message}\`;
      _deletePendingVideoOp(req.params.id);
      return res.status(500).json({ status: 'failed', error: op.error });
    }`;
const terminalPollFailureWithRefund = `    if (op.consecutiveErrors >= 5) {
      op.status = 'failed';
      op.error = \`Polling failed: \${err.message}\`;
      await refundPendingVideoOp(op, 'video polling failed repeatedly');
      _deletePendingVideoOp(req.params.id);
      return res.status(500).json({ status: 'failed', error: op.error });
    }`;
if (!source.includes("await refundPendingVideoOp(op, 'video polling failed repeatedly');")) {
  source = replaceOnce(
    source,
    terminalPollFailure,
    terminalPollFailureWithRefund,
    'terminal polling refund',
  );
}

const requiredMarkers = [
  serviceMarker,
  'getDb: getFirestoreDb',
  'getCreditCost,',
  '...reservationMetadataFor(req)',
  "settleDetachedReservation(op, 'refund'",
  "settleDetachedReservation(job, 'refund'",
  "settleDetachedReservation(op, 'consume'",
  "settleDetachedReservation(completedJob, 'consume'",
  "refundPendingVideoOp(op, 'video polling failed repeatedly'",
];
for (const marker of requiredMarkers) {
  if (!source.includes(marker)) {
    throw new Error(`Credit reservation postcondition failed: missing ${marker}`);
  }
}
if (source.includes(legacyStartMarker)) {
  throw new Error('Credit reservation postcondition failed: legacy deduction middleware remains.');
}

fs.writeFileSync(serverPath, usesCrLf ? source.replace(/\n/g, '\r\n') : source, 'utf8');
console.log('[credits] durable reservations, async settlement, and duplicate-submit protection are applied');
