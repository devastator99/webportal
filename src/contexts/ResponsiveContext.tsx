
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';

type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop';
type Orientation = 'portrait' | 'landscape';

interface ResponsiveContextType {
  deviceType: DeviceType;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLaptop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

const defaultContext: ResponsiveContextType = {
  deviceType: 'desktop',
  orientation: 'landscape',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isLaptop: false,
  isPortrait: false,
  isLandscape: true,
};

const ResponsiveContext = createContext<ResponsiveContextType>(defaultContext);

export const useResponsive = () => useContext(ResponsiveContext);

export const ResponsiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobileQuery = useMediaQuery('(max-width: 640px)');
  const isTabletQuery = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const isLaptopQuery = useMediaQuery('(min-width: 1025px) and (max-width: 1440px)');
  const isDesktopQuery = useMediaQuery('(min-width: 1441px)');
  const isPortraitQuery = useMediaQuery('(orientation: portrait)');

  const [state, setState] = useState<ResponsiveContextType>(defaultContext);

  useEffect(() => {
    let deviceType: DeviceType = 'desktop';
    if (isMobileQuery) deviceType = 'mobile';
    else if (isTabletQuery) deviceType = 'tablet';
    else if (isLaptopQuery) deviceType = 'laptop';
    else if (isDesktopQuery) deviceType = 'desktop';

    const orientation: Orientation = isPortraitQuery ? 'portrait' : 'landscape';

    setState({
      deviceType,
      orientation,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isLaptop: deviceType === 'laptop',
      isDesktop: deviceType === 'desktop',
      isPortrait: orientation === 'portrait',
      isLandscape: orientation === 'landscape',
    });
  }, [isMobileQuery, isTabletQuery, isLaptopQuery, isDesktopQuery, isPortraitQuery]);

  return (
    <ResponsiveContext.Provider value={state}>
      {children}
    </ResponsiveContext.Provider>
  );
};
