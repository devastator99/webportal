
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
        maxWidth,
        fullHeight && (
          isSmallScreen || isMobile 
            ? 'min-h-[calc(100vh-120px)]' 
            : isTablet || isMediumScreen 
              ? 'min-h-[calc(100vh-140px)]' 
              : 'min-h-[calc(100vh-160px)]'
        ),
        withPadding && (
          isSmallScreen || isMobile 
            ? 'px-2' 
            : isTablet || isMediumScreen 
              ? 'px-3' 
              : 'px-5'
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
          ? 'py-2 px-2' 
          : isTablet || isMediumScreen 
            ? 'py-2 px-3' 
            : 'py-3 px-4',
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
          ? 'py-2 px-2' 
          : isTablet || isMediumScreen 
            ? 'py-2 px-3' 
            : 'py-3 px-4',
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
          ? 'px-2 py-2' 
          : isTablet || isMediumScreen 
            ? 'px-3 py-2' 
            : 'px-4 py-3',
        className
      )}
    >
      {children}
    </div>
  );
};
