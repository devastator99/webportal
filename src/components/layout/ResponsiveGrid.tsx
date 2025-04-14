
import React from 'react';
import { useResponsive } from '@/contexts/ResponsiveContext';
import { cn } from '@/lib/utils';

type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12;

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  mobileColumns?: GridColumns;
  tabletColumns?: GridColumns;
  desktopColumns?: GridColumns;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveGrid = ({
  children,
  className,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 'md',
}: ResponsiveGridProps) => {
  const { deviceType } = useResponsive();
  
  // Determine cols based on current device
  const cols = 
    deviceType === 'mobile' ? mobileColumns :
    deviceType === 'tablet' ? tabletColumns :
    desktopColumns;
  
  // Map gap to Tailwind classes
  const gapClass = 
    gap === 'none' ? 'gap-0' :
    gap === 'xs' ? 'gap-1' :
    gap === 'sm' ? 'gap-2' :
    gap === 'md' ? 'gap-4' :
    gap === 'lg' ? 'gap-6' :
    'gap-8'; // xl
  
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${cols}`,
        gapClass,
        className
      )}
    >
      {children}
    </div>
  );
};
