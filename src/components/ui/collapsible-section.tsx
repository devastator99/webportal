
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface CollapsibleSectionProps {
  title: string;
  className?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSection = ({
  title,
  className,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("rounded-lg border bg-card shadow-sm", className)}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium">{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      
      {isOpen && <Separator />}
      
      {isOpen && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};
