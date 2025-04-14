
import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint, useResponsiveLayout } from '@/hooks/use-responsive';

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
  const { padding } = useResponsiveLayout();
  
  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidth,
        fullHeight && (isSmallScreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-160px)]'),
        withPadding && (isSmallScreen ? 'px-2' : isMediumScreen ? 'px-4' : 'px-6'),
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
  const { isSmallScreen } = useBreakpoint();
  
  return (
    <div
      className={cn(
        'w-full bg-background/95 backdrop-blur-sm z-10',
        sticky && 'sticky top-0',
        withBorder && 'border-b',
        isSmallScreen ? 'py-2 px-3' : 'py-3 px-4',
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
  const { isSmallScreen } = useBreakpoint();
  
  return (
    <div
      className={cn(
        'w-full bg-background/95 backdrop-blur-sm z-10',
        sticky && 'sticky bottom-0',
        withBorder && 'border-t',
        isSmallScreen ? 'py-2 px-3' : 'py-3 px-4',
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
  const { isSmallScreen } = useBreakpoint();
  
  return (
    <div
      className={cn(
        'w-full',
        scrollable && 'overflow-y-auto',
        isSmallScreen ? 'px-2 py-2' : 'px-4 py-3',
        className
      )}
    >
      {children}
    </div>
  );
};
