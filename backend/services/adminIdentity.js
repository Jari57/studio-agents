'use strict';

function configuredAdminEmails(value = '') {
  return String(value).split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
}

function isVerifiedAdmin(user, emails = []) {
  return Boolean(user?.uid && user.emailVerified === true &&
    emails.includes(String(user.email || '').toLowerCase()));
}

module.exports = { configuredAdminEmails, isVerifiedAdmin };
