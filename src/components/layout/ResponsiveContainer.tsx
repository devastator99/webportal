
import React from 'react';
import { useResponsive } from '@/contexts/ResponsiveContext';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  fluid?: boolean;
  withPadding?: boolean;
}

export const ResponsiveContainer = ({
  children,
  className,
  as: Component = 'div',
  fluid = false,
  withPadding = true,
}: ResponsiveContainerProps) => {
  const { isMobile, isTablet } = useResponsive();
  
  return (
    <Component
      className={cn(
        'w-full mx-auto transition-all duration-200',
        !fluid && 'max-w-screen-xl',
        withPadding && (
          isMobile 
            ? 'px-3 py-2' 
            : isTablet 
              ? 'px-4 py-3' 
              : 'px-6 py-4'
        ),
        className
      )}
    >
      {children}
    </Component>
  );
};
