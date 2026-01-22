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
    /ObjectMultiplex - malformed chunk without name "ACK"/i,
    /StreamMiddleware.*Unknown response id/i,
    /MetaMask/i,
    /inpage\.js/i,
    /runtime\.lastError.*listener indicated an asynchronous response/i,
    /message channel closed before a response was received/i,
    /A listener indicated an asynchronous response by returning true/i,
    /Unchecked runtime\.lastError/i,
    /Extension context invalidated/i,
    /Could not establish connection\. Receiving end does not exist/i
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
 * Suppress extension errors in production, warn in development
 */
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) {
  suppressExtensionErrors();
} else if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
   suppressExtensionErrors();
} else {
  // In development, still suppress but with a warning
  setTimeout(() => {
    console.info('%c[Console Cleaner] Extension error suppression active in development', 'color: #888; font-style: italic;');
  }, 1000);
  suppressExtensionErrors();
}
