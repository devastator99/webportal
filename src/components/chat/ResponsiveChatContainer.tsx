
import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint, useResponsiveLayout } from '@/hooks/use-responsive';
import { useResponsive } from '@/contexts/ResponsiveContext';

interface ResponsiveChatContainerProps {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
  withPadding?: boolean;
  maxWidth?: string;
}

export const ResponsiveChatContainer = ({
  children,
  className,
  fullHeight = true,
  withPadding = true,
  maxWidth = 'max-w-screen-lg',
}: ResponsiveChatContainerProps) => {
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const { isTablet, isMobile } = useResponsive();
  const { padding } = useResponsiveLayout();
  
  return (
    <div
      className={cn(
        'w-full mx-auto',
        isSmallScreen || isMobile ? '' : maxWidth, // Remove max-width on mobile for full width
        fullHeight && (
          isSmallScreen || isMobile 
            ? 'min-h-[calc(100vh-180px)]' // Reduced space for mobile navigation
            : isTablet || isMediumScreen 
              ? 'min-h-[calc(100vh-180px)]' // Consistent space for tablet  
              : 'min-h-[calc(100vh-160px)]'
        ),
        withPadding && (
          isSmallScreen || isMobile 
            ? 'px-0' // No horizontal padding for full width
            : isTablet || isMediumScreen 
              ? 'px-2' // Reduce horizontal padding
              : 'px-4' // Slightly reduce horizontal padding
        ),
        className
      )}
    >
      {children}
    </div>
  );
};

export const ResponsiveChatHeader = ({
  children,
  className,
  sticky = true,
  withBorder = true,
}: {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
  withBorder?: boolean;
}) => {
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const { isTablet, isMobile } = useResponsive();
  
  return (
    <div
      className={cn(
        'w-full bg-background/95 backdrop-blur-sm z-10',
        sticky && 'sticky top-0',
        withBorder && 'border-b',
        isSmallScreen || isMobile 
          ? 'py-0.5 px-0.5' // Minimum padding
          : isTablet || isMediumScreen 
            ? 'py-1 px-1.5' // Reduce padding
            : 'py-2 px-3', // Standard padding
        className
      )}
    >
      {children}
    </div>
  );
};

export const ResponsiveChatFooter = ({
  children,
  className,
  sticky = true,
  withBorder = true,
}: {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
  withBorder?: boolean;
}) => {
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const { isTablet, isMobile } = useResponsive();
  
  return (
    <div
      className={cn(
        'w-full bg-background/95 backdrop-blur-sm z-10',
        sticky && 'sticky bottom-0',
        withBorder && 'border-t',
        isSmallScreen || isMobile 
          ? 'py-1 px-0 pb-20' // No horizontal padding, ensure space for navigation
          : isTablet || isMediumScreen 
            ? 'py-1.5 px-2 pb-20' // Increased padding for tablet navigation
            : 'py-2 px-3',
        className
      )}
    >
      {children}
    </div>
  );
};

export const ResponsiveChatBody = ({
  children,
  className,
  scrollable = true,
}: {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}) => {
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const { isTablet, isMobile } = useResponsive();
  
  return (
    <div
      className={cn(
        'w-full',
        scrollable && 'overflow-y-auto',
        isSmallScreen || isMobile 
          ? 'px-0 py-0.5' // No horizontal padding for more space
          : isTablet || isMediumScreen 
            ? 'px-1.5 py-1' // Minimal padding
            : 'px-3 py-2', // Standard padding
        className
      )}
    >
      {children}
    </div>
  );
};
