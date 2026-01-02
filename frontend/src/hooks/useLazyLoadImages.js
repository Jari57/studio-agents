import { useEffect } from 'react';

/**
 * Hook to enable lazy loading for all images in the component
 * Uses Intersection Observer API for efficient lazy loading
 */
export const useLazyLoadImages = (containerRef) => {
  useEffect(() => {
    if (!containerRef?.current) return;

    // Create intersection observer for lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before entering viewport
    });

    // Observe all images with data-src attribute
    const images = containerRef.current.querySelectorAll('img[data-src]');
    images.forEach(img => imageObserver.observe(img));

    return () => imageObserver.disconnect();
  }, [containerRef]);
};
