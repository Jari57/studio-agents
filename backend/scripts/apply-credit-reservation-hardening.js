'use strict';

const fs = require('node:fs');
const path = require('node:path');

const serverPath = path.resolve(__dirname, '..', 'server.js');
const source = fs.readFileSync(serverPath, 'utf8');
const appliedMarker = "require('./services/creditReservation')";
const startMarker = 'const checkCreditsFor = (feature, amount) => {';
const endMarker = '// Fetch with timeout helper';

const replacement = `const { createCreditReservationService } = require('./services/creditReservation');
const {
  checkCreditsFor,
  refundCredits,
} = createCreditReservationService({ db, admin, getUid });

`;

if (source.includes(appliedMarker)) {
  if (source.includes(startMarker)) {
    throw new Error('Credit reservation patch is partially applied: legacy middleware is still present.');
  }
  console.log('[credits] durable reservation middleware already applied');
  process.exit(0);
}

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
if (start === -1 || end === -1 || end <= start) {
  throw new Error('Could not locate the legacy credit middleware block; refusing an unsafe partial patch.');
}

const updated = `${source.slice(0, start)}${replacement}${source.slice(end)}`;
if (!updated.includes(appliedMarker) || updated.includes(startMarker)) {
  throw new Error('Credit reservation patch postcondition failed.');
}

fs.writeFileSync(serverPath, updated, 'utf8');
console.log('[credits] replaced immediate deduction with durable idempotent reservations');
