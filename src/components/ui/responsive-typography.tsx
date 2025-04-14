
import React from 'react';
import { useResponsive } from '@/contexts/ResponsiveContext';
import { cn } from '@/lib/utils';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  as?: HeadingLevel | 'p' | 'span';
  mobileSize?: TextSize;
  tabletSize?: TextSize;
  desktopSize?: TextSize;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export const ResponsiveText = ({
  children,
  className,
  as: Component = 'p',
  mobileSize = 'base',
  tabletSize,
  desktopSize,
  weight = 'normal',
  align = 'left',
}: ResponsiveTextProps) => {
  const { isMobile, isTablet } = useResponsive();
  
  // Determine the proper size based on the device
  const size = isMobile ? mobileSize : 
               isTablet ? (tabletSize || mobileSize) : 
               (desktopSize || tabletSize || mobileSize);
  
  // Map weight to Tailwind class
  const weightClass = 
    weight === 'normal' ? 'font-normal' :
    weight === 'medium' ? 'font-medium' :
    weight === 'semibold' ? 'font-semibold' :
    'font-bold';
  
  // Map alignment to Tailwind class
  const alignClass = 
    align === 'left' ? 'text-left' :
    align === 'center' ? 'text-center' :
    'text-right';
  
  // Map size to Tailwind class
  const sizeClass = `text-${size}`;
  
  return (
    <Component
      className={cn(
        sizeClass,
        weightClass,
        alignClass,
        className
      )}
    >
      {children}
    </Component>
  );
};

// Heading component for semantic headings with responsive sizing
export const ResponsiveHeading = ({
  level = 'h2',
  children,
  className,
  mobileSize = '2xl',
  tabletSize = '3xl',
  desktopSize = '4xl',
  ...props
}: {
  level?: HeadingLevel;
} & Omit<ResponsiveTextProps, 'as'>) => {
  return (
    <ResponsiveText
      as={level}
      mobileSize={mobileSize}
      tabletSize={tabletSize}
      desktopSize={desktopSize}
      weight="bold"
      className={cn('leading-tight', className)}
      {...props}
    >
      {children}
    </ResponsiveText>
  );
};
