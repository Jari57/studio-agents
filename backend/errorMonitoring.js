/**
 * Backend Error Monitoring Module
 * 
 * Provides centralized error tracking and logging for the Express backend.
 * When Sentry DSN is configured, errors are sent to Sentry.
 * 
 * Setup:
 * 1. npm install @sentry/node
 * 2. Add SENTRY_DSN to backend/.env
 */

const SENTRY_DSN = process.env.SENTRY_DSN || '';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.APP_VERSION || '1.0.0';

let Sentry = null;

/**
 * Initialize error monitoring for Express
 * @param {Express} app - Express application instance
 */
async function initErrorMonitoring(app) {
  if (SENTRY_DSN) {
    try {
      Sentry = require('@sentry/node');
      
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: ENVIRONMENT,
        release: RELEASE,
        integrations: [
          // Express integration
          Sentry.expressIntegration({ app }),
        ],
        // Performance monitoring
        tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
        // Filter sensitive data
        beforeSend(event) {
          // Remove sensitive headers
          if (event.request?.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          return event;
        },
      });
      
      console.log('✅ Backend error monitoring initialized (Sentry)');
      return true;
    } catch (error) {
      console.warn('⚠️ Sentry initialization failed:', error.message);
      return false;
    }
  } else {
    console.log('ℹ️ Backend error monitoring: Local mode (add SENTRY_DSN for production)');
    return false;
  }
}

/**
 * Get Sentry request handler middleware
 * Add this BEFORE your routes
 */
function getRequestHandler() {
  if (Sentry) {
    return Sentry.Handlers.requestHandler();
  }
  // No-op middleware
  return (req, res, next) => next();
}

/**
 * Get Sentry tracing handler middleware
 * Add this AFTER request handler, BEFORE routes
 */
function getTracingHandler() {
  if (Sentry) {
    return Sentry.Handlers.tracingHandler();
  }
  return (req, res, next) => next();
}

/**
 * Get Sentry error handler middleware
 * Add this AFTER your routes, BEFORE other error handlers
 */
function getErrorHandler() {
  if (Sentry) {
    return Sentry.Handlers.errorHandler();
  }
  // Local error logging middleware
  return (err, req, res, next) => {
    console.error('🚨 Unhandled error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
    next(err);
  };
}

/**
 * Capture an exception manually
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
function captureException(error, context = {}) {
  if (Sentry) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('🚨 Error captured:', {
      message: error?.message,
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Capture a message/event
 * @param {string} message - The message to capture
 * @param {string} level - Severity level
 * @param {Object} context - Additional context
 */
function captureMessage(message, level = 'info', context = {}) {
  if (Sentry) {
    Sentry.captureMessage(message, { level, extra: context });
  } else {
    const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
    logFn(`📝 [${level.toUpperCase()}]:`, message, context);
  }
}

/**
 * Set user context for error tracking
 * @param {Object} user - User information
 */
function setUser(user) {
  if (Sentry) {
    Sentry.setUser({
      id: user?.uid,
      email: user?.email,
      username: user?.displayName,
    });
  }
}

/**
 * Create Express middleware that sets user context from Firebase token
 */
function userContextMiddleware() {
  return (req, res, next) => {
    if (req.user) {
      setUser(req.user);
    }
    next();
  };
}

/**
 * Wrap async route handlers to catch errors
 * @param {Function} fn - Async route handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      captureException(error, {
        path: req.path,
        method: req.method,
        userId: req.user?.uid,
      });
      next(error);
    });
  };
}

/**
 * Performance monitoring: Start a transaction
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 */
function startTransaction(name, op = 'task') {
  if (Sentry) {
    return Sentry.startSpan({ name, op });
  }
  const start = Date.now();
  return {
    finish: () => {
      const duration = Date.now() - start;
      console.log(`⏱️ ${name}: ${duration}ms`);
    },
  };
}

module.exports = {
  init: initErrorMonitoring,
  getRequestHandler,
  getTracingHandler,
  getErrorHandler,
  captureException,
  captureMessage,
  setUser,
  userContextMiddleware,
  asyncHandler,
  startTransaction,
};
