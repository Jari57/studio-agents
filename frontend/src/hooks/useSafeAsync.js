/**
 * useSafeAsync Hook
 * 
 * Prevents memory leaks and race conditions by:
 * 1. Tracking component mount status
 * 2. Providing AbortController for fetch requests
 * 3. Preventing state updates on unmounted components
 * 
 * Usage:
 * ```jsx
 * const { safeFetch, safeSetState, isMounted } = useSafeAsync();
 * 
 * const loadData = async () => {
 *   const response = await safeFetch('/api/data');
 *   if (!response || !isMounted()) return;
 *   
 *   const data = await response.json();
 *   safeSetState(() => setData(data));
 * };
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';

export const useSafeAsync = () => {
  const isMountedRef = useRef(true);
  const abortControllersRef = useRef(new Set());
  
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      // Component is unmounting - cleanup
      isMountedRef.current = false;
      
      // Abort all pending requests
      abortControllersRef.current.forEach(controller => {
        try {
          controller.abort();
        } catch (err) {
          console.warn('[useSafeAsync] Abort error:', err.message);
        }
      });
      abortControllersRef.current.clear();
    };
  }, []);
  
  /**
   * Safe fetch that automatically aborts on unmount
   */
  const safeFetch = useCallback(async (url, options = {}) => {
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      // Remove controller from set after successful completion
      abortControllersRef.current.delete(controller);
      
      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('[SafeFetch] Component unmounted after response, discarding data');
        return null;
      }
      
      return response;
    } catch (err) {
      // Remove controller from set
      abortControllersRef.current.delete(controller);
      
      if (err.name === 'AbortError') {
        console.log('[SafeFetch] Request aborted:', url);
        return null;
      }
      
      // Re-throw other errors for proper error handling
      throw err;
    }
  }, []);
  
  /**
   * Safe setState wrapper that checks mount status
   */
  const safeSetState = useCallback((setter) => {
    if (isMountedRef.current) {
      try {
        setter();
      } catch (err) {
        console.error('[SafeSetState] Error during setState:', err);
      }
    } else {
      console.warn('[SafeSetState] Prevented state update on unmounted component');
    }
  }, []);
  
  /**
   * Check if component is still mounted
   */
  const isMounted = useCallback(() => isMountedRef.current, []);
  
  /**
   * Manually abort all pending requests (useful for cleanup in specific scenarios)
   */
  const abortAll = useCallback(() => {
    abortControllersRef.current.forEach(controller => {
      try {
        controller.abort();
      } catch (err) {
        console.warn('[useSafeAsync] Manual abort error:', err.message);
      }
    });
    abortControllersRef.current.clear();
  }, []);
  
  return {
    safeFetch,
    safeSetState,
    isMounted,
    abortAll
  };
};

export default useSafeAsync;
