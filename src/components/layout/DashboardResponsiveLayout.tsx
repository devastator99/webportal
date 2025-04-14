
import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint, useResponsiveLayout } from '@/hooks/use-responsive';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useResponsive } from '@/contexts/ResponsiveContext';

interface DashboardResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
  withScrollArea?: boolean;
  fullHeight?: boolean;
  maxWidth?: string;
}

export const DashboardResponsiveLayout = ({
  children,
  className,
  withPadding = true,
  withScrollArea = true,
  fullHeight = true,
  maxWidth = 'max-w-screen-xl',
}: DashboardResponsiveLayoutProps) => {
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const { isTablet, isMobile } = useResponsive();
  const { padding } = useResponsiveLayout();
  
  const content = (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidth,
        withPadding && (
          isSmallScreen 
            ? 'px-2 py-3' 
            : isMediumScreen || isTablet 
              ? 'px-4 py-4' 
              : 'px-6 py-6'
        ),
        fullHeight && (
          isSmallScreen || isMobile 
            ? 'min-h-[calc(100vh-130px)]' 
            : isTablet || isMediumScreen 
              ? 'min-h-[calc(100vh-150px)]' 
              : 'min-h-[calc(100vh-180px)]'
        ),
        className
      )}
    >
      {children}
    </div>
  );
  
  if (withScrollArea) {
    return (
      <ScrollArea className="mb-16">
        {content}
      </ScrollArea>
    );
  }
  
  return content;
};

export const DashboardResponsiveSection = ({
  children,
  className,
  title,
  description,
  titleClassName,
  descriptionClassName,
  withMargin = true,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  withMargin?: boolean;
}) => {
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const { isTablet } = useResponsive();
  
  return (
    <section className={cn(
      withMargin && (
        isSmallScreen || isMobile 
          ? 'mb-4' 
          : isTablet || isMediumScreen 
            ? 'mb-5' 
            : 'mb-6'
      ),
      className
    )}>
      {title && (
        <h2 className={cn(
          'font-semibold mb-2',
          isSmallScreen 
            ? 'text-lg' 
            : isTablet || isMediumScreen 
              ? 'text-xl' 
              : 'text-2xl',
          titleClassName
        )}>
          {title}
        </h2>
      )}
      
      {description && (
        <p className={cn(
          'text-muted-foreground mb-3',
          isSmallScreen 
            ? 'text-sm' 
            : isTablet || isMediumScreen 
              ? 'text-base' 
              : 'text-lg',
          descriptionClassName
        )}>
          {description}
        </p>
      )}
      
      {children}
    </section>
  );
};

export const DashboardResponsiveGrid = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: 'gap-3', tablet: 'gap-4', desktop: 'gap-6' },
  className,
}: {
  children: React.ReactNode;
  columns?: { mobile: number; tablet?: number; desktop?: number };
  gap?: { mobile: string; tablet?: string; desktop?: string };
  className?: string;
}) => {
  const { isSmallScreen, isMediumScreen, isLargeScreen } = useBreakpoint();
  const { isTablet, isMobile } = useResponsive();
  
  const cols = isSmallScreen || isMobile 
    ? columns.mobile 
    : isTablet || isMediumScreen 
      ? (columns.tablet || columns.mobile) 
      : (columns.desktop || columns.tablet || columns.mobile);
               
  const gapSize = isSmallScreen || isMobile 
    ? gap.mobile 
    : isTablet || isMediumScreen 
      ? (gap.tablet || gap.mobile) 
      : (gap.desktop || gap.tablet || gap.mobile);
  
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${cols}`,
        gapSize,
        className
      )}
    >
      {children}
    </div>
  );
};
