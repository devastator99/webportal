
import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint, useResponsiveLayout } from '@/hooks/use-responsive';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
  withScrollArea?: boolean;
  fullHeight?: boolean;
}

export const DashboardResponsiveLayout = ({
  children,
  className,
  withPadding = true,
  withScrollArea = true,
  fullHeight = true,
}: DashboardResponsiveLayoutProps) => {
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const { padding } = useResponsiveLayout();
  
  const content = (
    <div
      className={cn(
        'w-full mx-auto',
        withPadding && (isSmallScreen ? 'px-2 py-3' : isMediumScreen ? 'px-4 py-4' : 'px-6 py-6'),
        fullHeight && 'min-h-[calc(100vh-180px)]',
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
  const { isSmallScreen } = useBreakpoint();
  
  return (
    <section className={cn(
      withMargin && (isSmallScreen ? 'mb-4' : 'mb-6'),
      className
    )}>
      {title && (
        <h2 className={cn(
          'font-semibold mb-2',
          isSmallScreen ? 'text-lg' : 'text-xl',
          titleClassName
        )}>
          {title}
        </h2>
      )}
      
      {description && (
        <p className={cn(
          'text-muted-foreground mb-3',
          isSmallScreen ? 'text-sm' : 'text-base',
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
  
  const cols = isSmallScreen ? columns.mobile : 
               isMediumScreen ? (columns.tablet || columns.mobile) : 
               (columns.desktop || columns.tablet || columns.mobile);
               
  const gapSize = isSmallScreen ? gap.mobile : 
                 isMediumScreen ? (gap.tablet || gap.mobile) : 
                 (gap.desktop || gap.tablet || gap.mobile);
  
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
