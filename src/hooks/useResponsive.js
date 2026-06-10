import { useState, useEffect } from 'react';

const queries = {
  mobile: '(max-width: 639px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
};

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [breakpoint, setBreakpoint] = useState('desktop');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mqls = {};
    for (const [key, query] of Object.entries(queries)) {
      mqls[key] = window.matchMedia(query);
    }

    const handler = () => {
      const mobile = mqls.mobile.matches;
      const tablet = mqls.tablet.matches;
      const desktop = mqls.desktop.matches;
      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsDesktop(desktop);
      setBreakpoint(mobile ? 'mobile' : tablet ? 'tablet' : 'desktop');
    };

    handler();
    for (const mql of Object.values(mqls)) {
      mql.addEventListener('change', handler);
    }
    return () => {
      for (const mql of Object.values(mqls)) {
        mql.removeEventListener('change', handler);
      }
    };
  }, []);

  return { isMobile, isTablet, isDesktop, breakpoint };
}
