import { useRef } from 'react';

export const useSwipeNavigation = (sections, activeSection, navigateTo) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchEndX = useRef(null);
  const touchEndY = useRef(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
      const currentIndex = sections.indexOf(activeSection);
      if (distanceX > 0) {
        // Swipe Left -> Next Section
        if (currentIndex < sections.length - 1) {
          navigateTo(sections[currentIndex + 1]);
        }
      } else {
        // Swipe Right -> Previous Section
        if (currentIndex > 0) {
          navigateTo(sections[currentIndex - 1]);
        }
      }
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};
