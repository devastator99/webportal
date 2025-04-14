
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
  compact?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'primary' | 'destructive';
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
  compact = false,
  variant = 'default',
}: ResponsiveCardProps) => {
  const { isMobile, isTablet } = useResponsive();
  
  // Compute padding based on device and compact mode
  const getPadding = () => {
    if (compact) {
      return isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5';
    }
    return isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6';
  };
  
  // Compute border radius based on device
  const borderRadius = isMobile ? 'rounded-lg' : 'rounded-xl';
  
  // Variant styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'bg-background border border-border';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground';
      case 'primary':
        return 'bg-[#9b87f5] text-white';
      case 'destructive':
        return 'bg-destructive text-destructive-foreground';
      default:
        return '';
    }
  };
  
  return (
    <Card className={cn(
      borderRadius,
      getVariantClasses(),
      withShadow && 'shadow-md',
      withHoverEffect && 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
      className
    )}>
      {(title || description) && (
        <CardHeader className={cn(
          isMobile ? 'pb-3' : 'pb-4',
          compact && 'py-3',
          headerClassName
        )}>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      {children && (
        <CardContent className={cn(
          compact && 'py-2',
          contentClassName
        )}>
          {children}
        </CardContent>
      )}
      
      {footer && (
        <CardFooter className={cn(
          compact && 'py-3',
          footerClassName
        )}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
