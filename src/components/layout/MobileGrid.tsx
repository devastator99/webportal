
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export const MobileGrid = ({ 
  children, 
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 }
}: MobileGridProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      'mobile-grid',
      `grid-cols-${columns.mobile}`,
      `sm:grid-cols-${columns.tablet}`,
      `lg:grid-cols-${columns.desktop}`,
      className
    )}>
      {children}
    </div>
  );
};
