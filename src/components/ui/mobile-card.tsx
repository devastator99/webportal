
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  compact?: boolean;
}

export const MobileCard = ({
  children,
  className,
  title,
  description,
  headerClassName,
  contentClassName,
  compact = false,
}: MobileCardProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className={cn(
      'w-full',
      isMobile ? 'rounded-lg shadow-sm' : 'rounded-xl shadow-md',
      className
    )}>
      {(title || description) && (
        <CardHeader className={cn(
          isMobile ? (compact ? 'p-3 pb-2' : 'p-4 pb-3') : 'p-6 pb-4',
          headerClassName
        )}>
          {title && (
            <CardTitle className={cn(
              isMobile ? 'text-base' : 'text-lg',
              'font-semibold'
            )}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={cn(
              isMobile ? 'text-sm' : 'text-base'
            )}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      
      {children && (
        <CardContent className={cn(
          isMobile ? (compact ? 'p-3 pt-0' : 'p-4 pt-0') : 'p-6 pt-0',
          contentClassName
        )}>
          {children}
        </CardContent>
      )}
    </Card>
  );
};
