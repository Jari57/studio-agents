'use strict';

// Shared by production middleware and real HTTP preflight regression tests.
function createCorsPolicy(allowedOrigins, logger = console) {
  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // Idempotency-Key is added after the creation record is saved. Omitting
    // it blocks every authenticated generation at the browser preflight.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Pipeline-Session', 'Idempotency-Key'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400,
  };
}

module.exports = { createCorsPolicy };
