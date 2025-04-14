
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/use-responsive';

interface MobileActionButtonProps extends ButtonProps {
  icon: React.ReactNode;
  label: string;
  fullWidth?: boolean;
  color?: 'primary' | 'secondary' | 'outline';
}

export const MobileActionButton = ({
  icon,
  label,
  fullWidth = false,
  color = 'primary',
  className,
  ...props
}: MobileActionButtonProps) => {
  const { isSmallScreen } = useBreakpoint();
  
  // Determine button styling based on color prop
  const colorStyles = {
    primary: 'bg-[#9b87f5] hover:bg-[#7E69AB] text-white',
    secondary: 'bg-[#E5DEFF] text-[#9b87f5] hover:bg-[#d1c9ff]',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  };
  
  return (
    <Button
      size={isSmallScreen ? 'sm' : 'default'}
      className={cn(
        'rounded-full',
        colorStyles[color],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {icon && (
        <span className={`${isSmallScreen ? 'mr-1' : 'mr-2'}`}>
          {icon}
        </span>
      )}
      <span className={isSmallScreen ? 'text-xs' : ''}>
        {label}
      </span>
    </Button>
  );
};

export const MobileActionButtonGroup = ({
  children,
  className,
  withEqualWidth = true,
}: {
  children: React.ReactNode;
  className?: string;
  withEqualWidth?: boolean;
}) => {
  const { isSmallScreen } = useBreakpoint();
  
  return (
    <div
      className={cn(
        'flex items-center',
        isSmallScreen ? 'gap-2' : 'gap-3',
        withEqualWidth && 'grid',
        withEqualWidth && (
          isSmallScreen 
            ? 'grid-cols-2 sm:grid-cols-3'
            : 'grid-cols-3 md:grid-cols-4'
        ),
        className
      )}
    >
      {children}
    </div>
  );
};

// Ready-made action buttons for common uses
export const AddButton = (props: Omit<MobileActionButtonProps, 'icon' | 'label' | 'color'>) => (
  <MobileActionButton
    icon={<PlusIcon />}
    label="Add"
    color="primary"
    {...props}
  />
);

export const EditButton = (props: Omit<MobileActionButtonProps, 'icon' | 'label' | 'color'>) => (
  <MobileActionButton
    icon={<EditIcon />}
    label="Edit"
    color="secondary"
    {...props}
  />
);

export const BackButton = (props: Omit<MobileActionButtonProps, 'icon' | 'label' | 'color'>) => (
  <MobileActionButton
    icon={<ArrowLeftIcon />}
    label="Back"
    color="outline"
    {...props}
  />
);

// Simple icon components for internal use
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 1C7.22386 1 7 1.22386 7 1.5V7H1.5C1.22386 7 1 7.22386 1 7.5C1 7.77614 1.22386 8 1.5 8H7V13.5C7 13.7761 7.22386 14 7.5 14C7.77614 14 8 13.7761 8 13.5V8H13.5C13.7761 8 14 7.77614 14 7.5C14 7.22386 13.7761 7 13.5 7H8V1.5C8 1.22386 7.77614 1 7.5 1Z" fill="currentColor" />
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z" fill="currentColor" />
  </svg>
);
