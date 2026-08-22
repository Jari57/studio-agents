'use strict';

const fs = require('node:fs');
const path = require('node:path');

const serverPath = path.resolve(__dirname, '..', 'server.js');
const source = fs.readFileSync(serverPath, 'utf8');
const appliedMarker = "createCreditReservationService({";
const legacyStartMarker = 'const checkCreditsFor = (featureType) => {';
const legacyEndMarker = '// Fetch with timeout helper';

const replacement = `const { createCreditReservationService } = require('./services/creditReservation');
const {
  checkCreditsFor,
  refundCredits,
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

if (source.includes(appliedMarker)) {
  if (source.includes(legacyStartMarker)) {
    throw new Error('Credit reservation patch is partially applied: legacy middleware is still present.');
  }
  if (!source.includes("getDb: getFirestoreDb") || !source.includes("getCreditCost,")) {
    throw new Error('Credit reservation patch is present but missing production pricing/database wiring.');
  }
  console.log('[credits] durable reservation middleware already applied');
  process.exit(0);
}

const start = source.indexOf(legacyStartMarker);
const end = source.indexOf(legacyEndMarker, start);
if (start === -1 || end === -1 || end <= start) {
  throw new Error('Could not locate the legacy credit middleware block; refusing an unsafe partial patch.');
}

const updated = `${source.slice(0, start)}${replacement}${source.slice(end)}`;
if (
  !updated.includes(appliedMarker)
  || updated.includes(legacyStartMarker)
  || !updated.includes("getDb: getFirestoreDb")
  || !updated.includes("getCreditCost,")
) {
  throw new Error('Credit reservation patch postcondition failed.');
}

fs.writeFileSync(serverPath, updated, 'utf8');
console.log('[credits] replaced immediate deduction with durable idempotent reservations');
