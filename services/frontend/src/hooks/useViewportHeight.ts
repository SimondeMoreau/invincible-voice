'use client';

import { useState, useEffect } from 'react';

interface ViewportHeight {
  /** Stable measured height: window.innerHeight at mount time (avoids iOS 100vh bug) */
  vh: number;
  /** Visual viewport height: shrinks when virtual keyboard is open */
  visualVh: number;
}

/**
 * Returns stable viewport height measurements for iOS-safe layout.
 *
 * `vh`: Set once on mount via window.innerHeight. Use as the total container
 *   height instead of 100vh / h-screen. On iOS Safari, window.innerHeight
 *   at mount is the visible area; 100vh overshoots by the browser chrome height.
 *
 * `visualVh`: Tracks window.visualViewport.height, which shrinks when the
 *   virtual keyboard opens. Use to calculate scroll compensation for chat/input:
 *   keyboardHeight = vh - visualVh (positive when keyboard is open).
 */
export const useViewportHeight = (): ViewportHeight => {
  const [vh, setVh] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0,
  );
  const [visualVh, setVisualVh] = useState<number>(
    typeof window !== 'undefined'
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 0,
  );

  useEffect(() => {
    // Set stable height once on mount (iOS: innerHeight before toolbar hides)
    setVh(window.innerHeight);
    setVisualVh(window.visualViewport?.height ?? window.innerHeight);

    const onWindowResize = () => {
      setVh(window.innerHeight);
    };

    const onVisualViewportResize = () => {
      setVisualVh(window.visualViewport?.height ?? window.innerHeight);
    };

    window.addEventListener('resize', onWindowResize);
    window.visualViewport?.addEventListener('resize', onVisualViewportResize);

    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.visualViewport?.removeEventListener(
        'resize',
        onVisualViewportResize,
      );
    };
  }, []);

  return { vh, visualVh };
};
