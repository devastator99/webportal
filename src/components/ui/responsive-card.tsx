
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useResponsive } from '@/contexts/ResponsiveContext';
import { cn } from '@/lib/utils';

interface ResponsiveCardProps {
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  withShadow?: boolean;
  withHoverEffect?: boolean;
}

export const ResponsiveCard = ({
  children,
  className,
  title,
  description,
  footer,
  headerClassName,
  contentClassName,
  footerClassName,
  withShadow = false,
  withHoverEffect = false,
}: ResponsiveCardProps) => {
  const { isMobile, isTablet } = useResponsive();
  
  // Compute padding and border radius based on device
  const padding = isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6';
  const borderRadius = isMobile ? 'rounded-lg' : 'rounded-xl';
  
  return (
    <Card className={cn(
      borderRadius,
      withShadow && 'shadow-md',
      withHoverEffect && 'transition-all duration-200 hover:shadow-lg',
      className
    )}>
      {(title || description) && (
        <CardHeader className={cn(
          isMobile ? 'pb-3' : 'pb-4',
          headerClassName
        )}>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      {children && (
        <CardContent className={cn(
          contentClassName
        )}>
          {children}
        </CardContent>
      )}
      
      {footer && (
        <CardFooter className={cn(
          footerClassName
        )}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
