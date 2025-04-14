
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
