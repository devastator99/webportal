
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
        isSmallScreen || isMobile ? '' : maxWidth,
        fullHeight && (
          isSmallScreen || isMobile 
            ? 'min-h-[calc(100vh-180px)]'
            : isTablet || isMediumScreen 
              ? 'min-h-[calc(100vh-180px)]'
              : 'min-h-[calc(100vh-160px)]'
        ),
        withPadding && (
          isSmallScreen || isMobile 
            ? 'px-0'
            : isTablet || isMediumScreen 
              ? 'px-2'
              : 'px-4'
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
          ? 'py-0.5 px-0.5'
          : isTablet || isMediumScreen 
            ? 'py-1 px-1.5'
            : 'py-2 px-3',
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
          ? 'py-1.5 px-0 pb-24' // Increased bottom padding to give more space for input
          : isTablet || isMediumScreen 
            ? 'py-2 px-2 pb-24' // Increased bottom padding
            : 'py-3 px-4', // Increased padding all around
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
          ? 'px-0 py-0.5'
          : isTablet || isMediumScreen 
            ? 'px-1.5 py-1'
            : 'px-3 py-2',
        className
      )}
    >
      {children}
    </div>
  );
};
