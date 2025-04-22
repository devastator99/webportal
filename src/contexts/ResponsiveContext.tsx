
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
  // Use more specific breakpoints for accurate device detection
  const isMobileQuery = useMediaQuery('(max-width: 639px)');
  const isTabletQuery = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isLaptopQuery = useMediaQuery('(min-width: 1024px) and (max-width: 1439px)');
  const isDesktopQuery = useMediaQuery('(min-width: 1440px)');
  const isPortraitQuery = useMediaQuery('(orientation: portrait)');

  const [state, setState] = useState<ResponsiveContextType>(() => {
    // Initialize with accurate default values based on window size
    let initialDeviceType: DeviceType = 'desktop';
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 639) initialDeviceType = 'mobile';
      else if (width <= 1023) initialDeviceType = 'tablet';
      else if (width <= 1439) initialDeviceType = 'laptop';
      else initialDeviceType = 'desktop';
    }
    
    const initialOrientation: Orientation = 
      typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches 
        ? 'portrait' 
        : 'landscape';
    
    return {
      deviceType: initialDeviceType,
      orientation: initialOrientation,
      isMobile: initialDeviceType === 'mobile',
      isTablet: initialDeviceType === 'tablet',
      isLaptop: initialDeviceType === 'laptop',
      isDesktop: initialDeviceType === 'desktop',
      isPortrait: initialOrientation === 'portrait',
      isLandscape: initialOrientation === 'landscape',
    };
  });

  useEffect(() => {
    // Update device type when media queries change
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
    
    // Log device detection for debugging
    console.log(`Device detected: ${deviceType}, Orientation: ${orientation}`);
  }, [isMobileQuery, isTabletQuery, isLaptopQuery, isDesktopQuery, isPortraitQuery]);

  return (
    <ResponsiveContext.Provider value={state}>
      {children}
    </ResponsiveContext.Provider>
  );
};
