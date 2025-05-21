
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
        !fluid && 'container',
        withPadding && (
          isMobile 
            ? 'px-4' 
            : isTablet 
              ? 'px-6' 
              : 'px-8'
        ),
        className
      )}
    >
      {children}
    </Component>
  );
};
