'use strict';

const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const TRANSIENT_CODES = new Set([
  'ABORT_ERR',
  'ECONNRESET',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

function providerStatus(error) {
  const candidates = [
    error?.status,
    error?.statusCode,
    error?.response?.status,
    error?.cause?.status,
  ];
  for (const candidate of candidates) {
    const status = Number(candidate);
    if (Number.isInteger(status) && status >= 100 && status <= 599) return status;
  }

  const match = String(error?.message || error || '').match(/(?:status(?:\s+code)?|http|error)?\s*[:=\[]?\s*(408|425|429|500|502|503|504)\b/i);
  return match ? Number(match[1]) : null;
}

function isTransientProviderError(error) {
  if (TRANSIENT_STATUSES.has(providerStatus(error))) return true;
  if (TRANSIENT_CODES.has(String(error?.code || error?.cause?.code || '').toUpperCase())) return true;

  return /abort|connection reset|fetch failed|network error|overload|rate.?limit|resource exhausted|temporar|timed?\s*out|timeout|try again|unavailable/i
    .test(String(error?.message || error || ''));
}

function retryAfterMs(error) {
  const headers = error?.response?.headers || error?.headers;
  const headerValue = typeof headers?.get === 'function'
    ? headers.get('retry-after')
    : headers?.['retry-after'];
  const directValue = error?.retryAfter ?? error?.retryAfterSeconds ?? headerValue;
  if (directValue !== undefined && directValue !== null && directValue !== '') {
    const seconds = Number(directValue);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

    const dateMs = Date.parse(String(directValue));
    if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now());
  }

  const message = String(error?.message || error || '');
  const duration = message.match(/(?:retry(?:[_ -]?after)?|retryDelay)[^0-9]*(\d+(?:\.\d+)?)\s*(ms|s|sec|seconds?|m|min|minutes?)\b/i);
  if (!duration) return null;

  const value = Number(duration[1]);
  const unit = duration[2].toLowerCase();
  if (unit === 'ms') return value;
  if (unit.startsWith('m')) return value * 60_000;
  return value * 1000;
}

function retryDelayMs(error, attempt, { baseDelayMs = 1000, maxDelayMs = 15_000, random = Math.random } = {}) {
  const requestedDelay = retryAfterMs(error);
  if (requestedDelay !== null) return Math.min(maxDelayMs, Math.max(0, requestedDelay));

  const exponentialDelay = baseDelayMs * (2 ** Math.max(0, attempt - 1));
  const jitter = 0.8 + (Math.max(0, Math.min(1, random())) * 0.4);
  return Math.min(maxDelayMs, Math.round(exponentialDelay * jitter));
}

async function runWithProviderRetry(operation, {
  maxAttempts = 3,
  baseDelayMs = 1000,
  maxDelayMs = 15_000,
  random = Math.random,
  sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
  onRetry = () => {},
} = {}) {
  if (typeof operation !== 'function') throw new TypeError('operation must be a function');

  const attempts = Math.max(1, Math.floor(maxAttempts));
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (attempt === attempts || !isTransientProviderError(error)) throw error;

      const delayMs = retryDelayMs(error, attempt, { baseDelayMs, maxDelayMs, random });
      await onRetry({ attempt, delayMs, error, status: providerStatus(error) });
      await sleep(delayMs);
    }
  }

  throw new Error('Provider retry loop exhausted');
}

module.exports = {
  isTransientProviderError,
  providerStatus,
  retryAfterMs,
  retryDelayMs,
  runWithProviderRetry,
};