
import React from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditButtonProps {
  onClick: () => void;
  className?: string;
}

export const EditButton = ({ onClick, className }: EditButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`p-2 hover:bg-secondary transition-colors rounded-full ${className}`}
      onClick={onClick}
    >
      <Pencil className="h-4 w-4 text-[#9b87f5]" />
    </Button>
  );
};
