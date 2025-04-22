
import { useEffect, useState } from 'react';
import { useMediaQuery } from './use-media-query';
import { useResponsive } from '@/contexts/ResponsiveContext';

interface ResponsiveLayoutOptions {
  padding: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  margin: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  gap: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export function useResponsiveLayout(): ResponsiveLayoutOptions {
  const { isMobile, isTablet } = useResponsive();
  
  // Default responsive layout values
  const defaultLayout: ResponsiveLayoutOptions = {
    padding: {
      mobile: 'p-2',
      tablet: 'p-3',
      desktop: 'p-4',
    },
    margin: {
      mobile: 'm-2',
      tablet: 'm-3',
      desktop: 'm-4',
    },
    gap: {
      mobile: 'gap-2',
      tablet: 'gap-3',
      desktop: 'gap-4',
    }
  };
  
  // Return responsive values based on current device
  return {
    padding: {
      mobile: defaultLayout.padding.mobile,
      tablet: defaultLayout.padding.tablet,
      desktop: defaultLayout.padding.desktop,
    },
    margin: {
      mobile: defaultLayout.margin.mobile,
      tablet: defaultLayout.margin.tablet,
      desktop: defaultLayout.margin.desktop,
    },
    gap: {
      mobile: defaultLayout.gap.mobile,
      tablet: defaultLayout.gap.tablet,
      desktop: defaultLayout.gap.desktop,
    }
  };
}

export function useBreakpoint() {
  const isSmallScreen = useMediaQuery('(max-width: 639px)');
  const isMediumScreen = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  
  return {
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
  };
}

export function useResponsiveButtonSize({
  mobile = 'sm',
  tablet = 'default',
  default: defaultSize = 'default'
}: {
  mobile?: 'sm' | 'default' | 'lg';
  tablet?: 'sm' | 'default' | 'lg';
  default?: 'sm' | 'default' | 'lg';
}) {
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  
  if (isSmallScreen) return mobile;
  if (isMediumScreen) return tablet;
  return defaultSize;
}

export function useResponsiveValue<T>({
  mobile,
  tablet,
  desktop,
  default: defaultValue
}: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  const { isSmallScreen, isMediumScreen, isLargeScreen } = useBreakpoint();
  
  if (isSmallScreen && mobile !== undefined) return mobile;
  if (isMediumScreen && tablet !== undefined) return tablet;
  if (isLargeScreen && desktop !== undefined) return desktop;
  return defaultValue;
}
