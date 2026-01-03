/**
 * Extension Error Suppression
 * Filters out harmless browser extension errors (MetaMask, etc.)
 * These don't affect app functionality but clutter the console
 */

export function suppressExtensionErrors() {
  if (typeof window === 'undefined') return;

  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // List of harmless extension errors to suppress
  const suppressPatterns = [
    /ObjectMultiplex.*malformed chunk/i,
    /StreamMiddleware.*Unknown response id/i,
    /MetaMask/i,
    /inpage\.js/i,
  ];

  const shouldSuppress = (message) => {
    if (!message) return false;
    const str = typeof message === 'string' ? message : String(message);
    return suppressPatterns.some(pattern => pattern.test(str));
  };

  // Override console.warn
  console.warn = function(...args) {
    if (args.length > 0 && !shouldSuppress(args[0])) {
      originalWarn.apply(console, args);
    }
  };

  // Override console.error
  console.error = function(...args) {
    if (args.length > 0 && !shouldSuppress(args[0])) {
      originalError.apply(console, args);
    }
  };
}

/**
 * Suppress extension errors in production only
 * In development, you might want to see all errors
 */
if (process.env.NODE_ENV === 'production') {
  suppressExtensionErrors();
}
