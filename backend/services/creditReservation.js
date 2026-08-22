'use strict';

const { createHash, randomUUID } = require('node:crypto');

const DEFAULT_STARTING_CREDITS = 25;
const DEFAULT_RESERVATION_TTL_MS = 20 * 60 * 1000;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,200}$/;

function normalizeIdempotencyKey(value) {
  const normalized = String(value || '').trim();
  if (!normalized || !IDEMPOTENCY_KEY_PATTERN.test(normalized)) return null;
  return normalized;
}

function stableSerialize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;

  return `{${Object.keys(value)
    .sort()
    .filter((key) => !['idempotencyKey', 'requestId', 'generationId'].includes(key))
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
    .join(',')}}`;
}

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function requestFingerprint({ userId, feature, amount, body }) {
  return sha256(stableSerialize({ userId, feature, amount, body: body || {} }));
}

function reservationDocumentId(userId, idempotencyKey) {
  return sha256(`${userId}:${idempotencyKey}`);
}

function timestampToMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value._seconds === 'number') return value._seconds * 1000;
  return null;
}

function resolveExistingReservation(existing, fingerprint, nowMs = Date.now()) {
  if (!existing) return { kind: 'reserve' };
  if (existing.requestHash !== fingerprint) return { kind: 'conflict' };

  if (existing.status === 'consumed') return { kind: 'completed' };
  if (existing.status === 'refunded') return { kind: 'failed' };

  if (existing.status === 'reserved') {
    const expiresAt = timestampToMillis(existing.expiresAt);
    if (expiresAt !== null && expiresAt <= nowMs) {
      return { kind: 'expire-and-refund' };
    }
    return { kind: 'in-progress' };
  }

  return { kind: 'conflict' };
}

function settlementOutcomeForStatus(statusCode) {
  return statusCode >= 200 && statusCode < 300 ? 'consume' : 'refund';
}

function creditOptionsFromRequest(req) {
  return {
    duration: Number(req.body?.duration || req.body?.durationSeconds || 30),
  };
}

function resolveCreditAmount(getCreditCost, feature, req) {
  const amount = Number(getCreditCost(feature, creditOptionsFromRequest(req)));
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw new Error(`Invalid credit price for ${feature}`);
  }
  return amount;
}

function errorPayload(kind, reservationId) {
  if (kind === 'completed') {
    return {
      status: 409,
      code: 'IDEMPOTENT_REQUEST_COMPLETED',
      error: 'This generation request already completed. Open the saved result instead of charging and running it again.',
      reservationId,
    };
  }
  if (kind === 'in-progress') {
    return {
      status: 409,
      code: 'GENERATION_ALREADY_IN_PROGRESS',
      error: 'This generation request is already in progress. Do not submit it again.',
      reservationId,
    };
  }
  if (kind === 'failed') {
    return {
      status: 409,
      code: 'IDEMPOTENT_REQUEST_REFUNDED',
      error: 'The earlier request failed and its credit was restored. Retry with a new idempotency key.',
      reservationId,
    };
  }
  if (kind === 'expired-refunded') {
    return {
      status: 409,
      code: 'EXPIRED_RESERVATION_REFUNDED',
      error: 'The earlier request expired and its credit was restored. Retry with a new idempotency key.',
      reservationId,
    };
  }
  return {
    status: 409,
    code: 'IDEMPOTENCY_KEY_CONFLICT',
    error: 'That idempotency key was already used for a different generation request.',
    reservationId,
  };
}

function createCreditReservationService({
  getDb,
  admin,
  getUserId,
  getUserEmail = () => null,
  getCreditCost,
  shouldSkip = () => false,
  reservationTtlMs = DEFAULT_RESERVATION_TTL_MS,
  logger = console,
}) {
  if (typeof getDb !== 'function') {
    throw new TypeError('createCreditReservationService requires getDb().');
  }
  if (typeof getUserId !== 'function') {
    throw new TypeError('createCreditReservationService requires getUserId(req).');
  }
  if (typeof getCreditCost !== 'function') {
    throw new TypeError('createCreditReservationService requires getCreditCost(feature, options).');
  }

  const fieldValue = admin?.firestore?.FieldValue;
  const timestamp = admin?.firestore?.Timestamp;

  function serverTimestamp() {
    return fieldValue?.serverTimestamp ? fieldValue.serverTimestamp() : new Date();
  }

  function expiryTimestamp(expiresAtMs) {
    return timestamp?.fromMillis ? timestamp.fromMillis(expiresAtMs) : new Date(expiresAtMs);
  }

  function increment(amount) {
    return fieldValue?.increment ? fieldValue.increment(amount) : amount;
  }

  function requestKey(req) {
    const headerValue = typeof req.get === 'function'
      ? req.get('Idempotency-Key') || req.get('X-Idempotency-Key')
      : req.headers?.['idempotency-key'] || req.headers?.['x-idempotency-key'];
    const bodyValue = req.body?.idempotencyKey || req.body?.requestId || req.body?.generationId;
    const supplied = normalizeIdempotencyKey(headerValue || bodyValue);
    return { key: supplied || randomUUID(), generated: !supplied };
  }

  function reservationRefs(db, userId, idempotencyKey) {
    const reservationId = reservationDocumentId(userId, idempotencyKey);
    const reservationRef = db.collection('creditReservations').doc(reservationId);
    const userRef = db.collection('users').doc(userId);
    return { reservationId, reservationRef, userRef };
  }

  async function reserve(req, feature, amount, db) {
    const userId = getUserId(req);
    if (!userId) return { kind: 'unauthorized' };

    const { key: idempotencyKey, generated } = requestKey(req);
    const fingerprint = requestFingerprint({
      userId,
      feature,
      amount,
      body: req.body || {},
    });
    const { reservationId, reservationRef, userRef } = reservationRefs(db, userId, idempotencyKey);
    const historyRef = userRef.collection('credit_history').doc();
    const nowMs = Date.now();

    const result = await db.runTransaction(async (transaction) => {
      const reservationSnapshot = await transaction.get(reservationRef);
      const userSnapshot = await transaction.get(userRef);
      const existing = reservationSnapshot.exists ? reservationSnapshot.data() : null;
      const disposition = resolveExistingReservation(existing, fingerprint, nowMs);

      if (disposition.kind === 'expire-and-refund') {
        const restoreAmount = Number(existing?.amount || 0);
        if (restoreAmount > 0) {
          transaction.set(userRef, {
            credits: increment(restoreAmount),
            updatedAt: serverTimestamp(),
          }, { merge: true });
          transaction.set(historyRef, {
            type: 'refund',
            amount: restoreAmount,
            feature: existing.feature || feature,
            reason: 'reservation_expired',
            reservationId,
            timestamp: serverTimestamp(),
          });
        }
        transaction.set(reservationRef, {
          status: 'refunded',
          refundReason: 'reservation_expired',
          refundedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        return { kind: 'expired-refunded' };
      }

      if (disposition.kind !== 'reserve') return disposition;

      const currentCredits = userSnapshot.exists && Number.isFinite(Number(userSnapshot.data()?.credits))
        ? Number(userSnapshot.data().credits)
        : DEFAULT_STARTING_CREDITS;
      if (currentCredits < amount) {
        return { kind: 'insufficient', available: currentCredits };
      }

      const balanceAfter = currentCredits - amount;
      transaction.set(userRef, {
        email: getUserEmail(req) || userSnapshot.data()?.email || null,
        credits: balanceAfter,
        tier: userSnapshot.data()?.tier || 'free',
        createdAt: userSnapshot.exists ? (userSnapshot.data()?.createdAt || serverTimestamp()) : serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      transaction.set(reservationRef, {
        userId,
        feature,
        amount,
        requestHash: fingerprint,
        keyHash: sha256(idempotencyKey),
        status: 'reserved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: expiryTimestamp(nowMs + reservationTtlMs),
      });
      transaction.set(historyRef, {
        type: 'reserve',
        amount: -amount,
        feature,
        reason: `${feature} generation reserved`,
        reservationId,
        balanceBefore: currentCredits,
        balanceAfter,
        timestamp: serverTimestamp(),
      });

      return { kind: 'reserved', balanceAfter };
    });

    return {
      ...result,
      userId,
      feature,
      amount,
      idempotencyKey,
      generated,
      reservationId,
      reservationRef,
      userRef,
      db,
    };
  }

  async function settleReservation(req, outcome, reason) {
    const db = req.creditReservationDb;
    if (!db || !req.creditReservationId || !req.creditReservationRef || !req.creditUserRef) {
      return false;
    }
    if (req.creditReservationSettlementPromise) {
      return req.creditReservationSettlementPromise;
    }

    const settlement = db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(req.creditReservationRef);
      if (!snapshot.exists) return false;
      const reservation = snapshot.data() || {};
      if (reservation.status !== 'reserved') return false;

      const amount = Number(reservation.amount || req.creditCharged || 0);
      const historyRef = req.creditUserRef.collection('credit_history').doc();
      if (outcome === 'refund' && amount > 0) {
        transaction.set(req.creditUserRef, {
          credits: increment(amount),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        transaction.set(historyRef, {
          type: 'refund',
          amount,
          feature: reservation.feature || req.creditFeature,
          reason: String(reason || 'generation_failed'),
          reservationId: req.creditReservationId,
          timestamp: serverTimestamp(),
        });
      } else {
        transaction.set(historyRef, {
          type: 'consume',
          amount: 0,
          feature: reservation.feature || req.creditFeature,
          reason: 'generation completed',
          reservationId: req.creditReservationId,
          timestamp: serverTimestamp(),
        });
      }

      transaction.set(req.creditReservationRef, {
        status: outcome === 'refund' ? 'refunded' : 'consumed',
        refundReason: outcome === 'refund' ? String(reason || 'generation_failed') : null,
        refundedAt: outcome === 'refund' ? serverTimestamp() : null,
        consumedAt: outcome === 'consume' ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    });

    req.creditReservationSettlementPromise = settlement;
    try {
      const changed = await settlement;
      req.creditReservationFinalized = true;
      if (outcome === 'refund') req.creditCharged = 0;
      return changed;
    } catch (error) {
      req.creditReservationSettlementPromise = null;
      logger.error?.('[credits] reservation settlement failed', {
        reservationId: req.creditReservationId,
        outcome,
        error: error?.message || String(error),
      });
      throw error;
    }
  }

  function attachAutomaticSettlement(req, res) {
    res.once('finish', () => {
      const outcome = settlementOutcomeForStatus(res.statusCode);
      void settleReservation(req, outcome, `http_${res.statusCode}`).catch(() => {});
    });
    res.once('close', () => {
      if (!res.writableEnded) {
        void settleReservation(req, 'refund', 'connection_closed').catch(() => {});
      }
    });
  }

  function checkCreditsFor(feature) {
    return async (req, res, next) => {
      const skipReason = shouldSkip(req, feature);
      if (skipReason) {
        req.creditCharged = 0;
        req.creditSkipReason = String(skipReason);
        return next();
      }

      const db = getDb();
      if (!db) {
        return res.status(503).json({
          error: 'Credit verification is temporarily unavailable. No generation was started and no credit was charged.',
          code: 'CREDIT_RESERVATION_UNAVAILABLE',
        });
      }

      let amount;
      try {
        amount = resolveCreditAmount(getCreditCost, feature, req);
        const result = await reserve(req, feature, amount, db);
        if (result.kind === 'unauthorized') {
          return res.status(401).json({ error: 'Authentication required' });
        }
        if (result.kind === 'insufficient') {
          return res.status(403).json({
            error: 'Insufficient Credits',
            details: `This action requires ${amount} credits. Please upgrade your plan or purchase more credits.`,
            required: amount,
            available: result.available,
            feature,
            isUserCreditIssue: true,
          });
        }
        if (result.kind !== 'reserved') {
          const payload = errorPayload(result.kind, result.reservationId);
          if (result.kind === 'in-progress') res.setHeader('Retry-After', '5');
          return res.status(payload.status).json(payload);
        }

        req.creditCharged = amount;
        req.creditFeature = feature;
        req.featureType = feature;
        req.creditReservationId = result.reservationId;
        req.creditReservationRef = result.reservationRef;
        req.creditUserRef = result.userRef;
        req.creditReservationDb = result.db;
        req.creditIdempotencyKey = result.idempotencyKey;
        res.setHeader('Idempotency-Key', result.idempotencyKey);
        res.setHeader('X-Credit-Reservation-Id', result.reservationId);
        res.setHeader(
          'Access-Control-Expose-Headers',
          'Idempotency-Key, X-Credit-Reservation-Id, X-Idempotency-Key-Generated',
        );
        if (result.generated) res.setHeader('X-Idempotency-Key-Generated', 'true');
        attachAutomaticSettlement(req, res);
        return next();
      } catch (error) {
        logger.error?.('[credits] reservation failed', {
          feature,
          amount,
          error: error?.message || String(error),
        });
        return res.status(503).json({
          error: 'Credit verification is temporarily unavailable. No generation was started and no credit was charged.',
          code: 'CREDIT_RESERVATION_UNAVAILABLE',
        });
      }
    };
  }

  async function refundCredits(req, reason) {
    try {
      return await settleReservation(req, 'refund', reason || 'generation_failed');
    } catch {
      return false;
    }
  }

  return {
    checkCreditsFor,
    refundCredits,
    settleReservation,
  };
}

module.exports = {
  DEFAULT_RESERVATION_TTL_MS,
  createCreditReservationService,
  creditOptionsFromRequest,
  normalizeIdempotencyKey,
  requestFingerprint,
  reservationDocumentId,
  resolveCreditAmount,
  resolveExistingReservation,
  settlementOutcomeForStatus,
  stableSerialize,
};
