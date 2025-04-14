
import { useResponsive } from '@/contexts/ResponsiveContext';

export function useResponsiveValue<T>(
  options: {
    mobile?: T;
    tablet?: T;
    laptop?: T;
    desktop?: T;
    default: T;
  }
): T {
  const { deviceType } = useResponsive();
  
  switch (deviceType) {
    case 'mobile':
      return options.mobile ?? options.default;
    case 'tablet':
      return options.tablet ?? options.laptop ?? options.desktop ?? options.default;
    case 'laptop':
      return options.laptop ?? options.desktop ?? options.default;
    case 'desktop':
      return options.desktop ?? options.default;
    default:
      return options.default;
  }
}

// Helper for responsive spacing
export function useResponsiveSpacing(
  baseSpacing: number = 4,
  multipliers = { mobile: 1, tablet: 2, laptop: 3, desktop: 4 }
): number {
  const { deviceType } = useResponsive();
  
  switch (deviceType) {
    case 'mobile':
      return baseSpacing * multipliers.mobile;
    case 'tablet':
      return baseSpacing * multipliers.tablet;
    case 'laptop':
      return baseSpacing * multipliers.laptop;
    case 'desktop':
      return baseSpacing * multipliers.desktop;
    default:
      return baseSpacing;
  }
}

// New utility functions for responsive design
export function useBreakpoint() {
  const { isMobile, isTablet, isLaptop, isDesktop } = useResponsive();
  
  return {
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isLaptop || isDesktop,
    current: isMobile ? 'mobile' : isTablet ? 'tablet' : isLaptop ? 'laptop' : 'desktop'
  };
}

// Helper for responsive font sizes
export function useResponsiveFontSize(
  sizes: {
    mobile?: number;
    tablet?: number;
    laptop?: number;
    desktop?: number;
    default: number;
  }
): number {
  return useResponsiveValue(sizes);
}

// Helper for conditional rendering based on screen size
export function useResponsiveRendering() {
  const { isMobile, isTablet, isLaptop, isDesktop } = useResponsive();
  
  return {
    renderOnMobile: (content: React.ReactNode) => isMobile ? content : null,
    renderOnTablet: (content: React.ReactNode) => isTablet ? content : null,
    renderOnLaptop: (content: React.ReactNode) => isLaptop ? content : null,
    renderOnDesktop: (content: React.ReactNode) => isDesktop ? content : null,
    renderOnLargeScreen: (content: React.ReactNode) => (isLaptop || isDesktop) ? content : null,
    renderOnSmallScreen: (content: React.ReactNode) => (isMobile || isTablet) ? content : null,
  };
}
