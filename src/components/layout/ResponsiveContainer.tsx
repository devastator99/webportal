
import React from 'react';
import { useResponsive } from '@/contexts/ResponsiveContext';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/use-responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  fluid?: boolean;
  withPadding?: boolean;
  compact?: boolean;
}

export const ResponsiveContainer = ({
  children,
  className,
  as: Component = 'div',
  fluid = false,
  withPadding = true,
  compact = false,
}: ResponsiveContainerProps) => {
  const { isMobile, isTablet } = useResponsive();
  const { isSmallScreen } = useBreakpoint();
  
  return (
    <Component
      className={cn(
        'w-full mx-auto transition-all duration-200',
        !fluid && 'container',
        withPadding && (
          isSmallScreen || isMobile
            ? compact ? 'px-1' : 'px-2' 
            : isTablet 
              ? compact ? 'px-3' : 'px-4' 
              : compact ? 'px-4' : 'px-6'
        ),
        className
      )}
    >
      {children}
    </Component>
  );
};
