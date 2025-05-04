
import React from 'react';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A reusable content container component that provides consistent width, margin, and padding
 * This ensures all pages have the same layout structure for content
 */
export const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`w-full max-w-[1200px] mx-auto px-4 ${className}`}>
      {children}
    </div>
  );
};
