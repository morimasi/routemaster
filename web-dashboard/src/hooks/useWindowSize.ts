import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
    return {
      width: w,
      height: h,
      isMobile: w < 640,
      isTablet: w >= 640 && w < 1024,
      isDesktop: w >= 1024,
    };
  });

  useEffect(() => {
    let ticking = false;
    const handle = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          setSize({
            width: w,
            height: h,
            isMobile: w < 640,
            isTablet: w >= 640 && w < 1024,
            isDesktop: w >= 1024,
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  return size;
}
