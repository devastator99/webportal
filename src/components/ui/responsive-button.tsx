
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveButtonProps extends ButtonProps {
  mobileVariant?: ButtonProps['variant'];
  mobileSize?: ButtonProps['size'];
  fullWidthOnMobile?: boolean;
}

export const ResponsiveButton = ({
  children,
  className,
  mobileVariant,
  mobileSize = 'sm',
  fullWidthOnMobile = false,
  variant,
  size,
  ...props
}: ResponsiveButtonProps) => {
  const isMobile = useIsMobile();
  
  const finalVariant = isMobile && mobileVariant ? mobileVariant : variant;
  const finalSize = isMobile ? mobileSize : size;
  
  return (
    <Button
      variant={finalVariant}
      size={finalSize}
      className={cn(
        isMobile && fullWidthOnMobile && 'w-full',
        'mobile-button',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
