/**
 * Error Monitoring Module
 * 
 * Provides error tracking and performance monitoring with local logging.
 * Errors are captured, logged to console, and stored in localStorage.
 * 
 * For production Sentry integration:
 * 1. npm install @sentry/react
 * 2. Uncomment the Sentry integration code below
 * 3. Add VITE_SENTRY_DSN to your .env file
 */

// Configuration
const ENVIRONMENT = import.meta.env.MODE || 'development';
const RELEASE = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Error queue for batching
const errorQueue = [];
const MAX_QUEUE_SIZE = 100;

// User context
let currentUser = null;

// Breadcrumbs for debugging
const breadcrumbs = [];
const MAX_BREADCRUMBS = 50;

/**
 * Initialize error monitoring
 * Call this once at app startup
 */
export async function initErrorMonitoring() {
  console.log(`ℹ️ Error monitoring initialized (local mode - ${ENVIRONMENT})`);
  setupLocalErrorHandling();
  return true;
}

/**
 * Setup local error handling for development
 */
function setupLocalErrorHandling() {
  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    captureException(event.error || new Error(event.message), {
      type: 'unhandled',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason || new Error('Unhandled Promise Rejection'), {
      type: 'unhandledrejection',
    });
  });
}

/**
 * Capture an exception
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export function captureException(error, context = {}) {
  const errorData = {
    message: error?.message || String(error),
    stack: error?.stack,
    context,
    user: currentUser,
    breadcrumbs: [...breadcrumbs],
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    environment: ENVIRONMENT,
    release: RELEASE,
  };

  // Local logging
  console.error('🚨 Error captured:', errorData);
  
  // Add to queue
  errorQueue.push(errorData);
  if (errorQueue.length > MAX_QUEUE_SIZE) {
    errorQueue.shift(); // Remove oldest
  }
  
  // Store in localStorage for persistence
  try {
    localStorage.setItem('error_log', JSON.stringify(errorQueue.slice(-20)));
  } catch (e) {
    // localStorage full or disabled
  }
}

/**
 * Capture a message/event
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 * @param {Object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
  const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
  logFn(`📝 [${level.toUpperCase()}]:`, message, context);
  
  // Also add to breadcrumbs
  addBreadcrumb(message, 'message', { level, ...context });
}

/**
 * Set user context for error tracking
 * @param {Object} user - User information
 */
export function setUser(user) {
  currentUser = user ? {
    id: user?.uid,
    email: user?.email,
    username: user?.displayName,
  } : null;
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  currentUser = null;
}

/**
 * Add breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {string} category - Category (ui, navigation, api, etc.)
 * @param {Object} data - Additional data
 */
export function addBreadcrumb(message, category = 'action', data = {}) {
  breadcrumbs.push({
    message,
    category,
    data,
    timestamp: new Date().toISOString(),
  });
  
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
}

/**
 * Start a performance transaction
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 * @returns {Object} Transaction object with finish method
 */
export function startTransaction(name, op = 'task') {
  const start = performance.now();
  addBreadcrumb(`Started: ${name}`, 'performance', { op });
  
  return {
    finish: () => {
      const duration = performance.now() - start;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      addBreadcrumb(`Finished: ${name}`, 'performance', { op, duration });
    },
  };
}

/**
 * Get local error log (for development/debugging)
 */
export function getErrorLog() {
  return errorQueue;
}

/**
 * Clear local error log
 */
export function clearErrorLog() {
  errorQueue.length = 0;
  try {
    localStorage.removeItem('error_log');
  } catch (e) {
    // Ignore
  }
}

// Export for React Error Boundary integration
export function createErrorBoundaryHandler(componentName) {
  return (error, errorInfo) => {
    captureException(error, {
      component: componentName,
      componentStack: errorInfo?.componentStack,
    });
  };
}

export default {
  init: initErrorMonitoring,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction,
  getErrorLog,
  clearErrorLog,
};
