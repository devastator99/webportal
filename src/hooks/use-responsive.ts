
import { useResponsive } from '@/contexts/ResponsiveContext';

type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop';
type ButtonSize = 'sm' | 'lg' | 'default' | 'icon';

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

// Helper function specifically for button sizes to ensure type safety
export function useResponsiveButtonSize(
  options: {
    mobile?: ButtonSize;
    tablet?: ButtonSize;
    laptop?: ButtonSize;
    desktop?: ButtonSize;
    default: ButtonSize;
  }
): ButtonSize {
  return useResponsiveValue(options);
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
    renderAboveMobile: (content: React.ReactNode) => (!isMobile) ? content : null,
    renderBelowDesktop: (content: React.ReactNode) => (isMobile || isTablet || isLaptop) ? content : null,
  };
}

// New helper for responsive layouts
export function useResponsiveLayout() {
  const { isMobile, isTablet } = useResponsive();
  
  return {
    gridCols: isMobile ? 1 : isTablet ? 2 : 3,
    contentWidth: isMobile ? 'w-full' : isTablet ? 'w-[90%]' : 'w-[85%]',
    gapSize: isMobile ? 'gap-3' : isTablet ? 'gap-4' : 'gap-6',
    padding: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6',
    margin: isMobile ? 'my-3' : isTablet ? 'my-4' : 'my-6',
    rounded: isMobile ? 'rounded-lg' : 'rounded-xl',
    stackOnMobile: isMobile ? 'flex-col' : 'flex-row',
    hideOnMobile: isMobile ? 'hidden' : 'block',
    showOnlyOnMobile: isMobile ? 'block' : 'hidden',
  };
}
