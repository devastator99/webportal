
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface CollapsibleSectionProps {
  title: string;
  className?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  lazyLoad?: boolean;
}

export const CollapsibleSection = ({
  title,
  className,
  defaultOpen = false,
  children,
  lazyLoad = true,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasLoaded, setHasLoaded] = useState(defaultOpen);
  const [isLoading, setIsLoading] = useState(false);
  const { resetInactivityTimer } = useAuth();

  // Optimized toggle function
  const handleToggle = () => {
    resetInactivityTimer();
    
    if (!isOpen && !hasLoaded && lazyLoad) {
      setIsLoading(true);
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        setIsOpen(true);
        // Delay loading content slightly for smoother transition
        setTimeout(() => {
          setHasLoaded(true);
          setIsLoading(false);
        }, 50);
      });
    } else {
      setIsOpen(!isOpen);
    }
  };

  // If not lazy loading, mark as loaded immediately
  useEffect(() => {
    if (!lazyLoad) {
      setHasLoaded(true);
    }
  }, [lazyLoad]);

  return (
    <div className={cn("rounded-lg border bg-card shadow-sm", className)}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={handleToggle}
        data-state={isOpen ? "open" : "closed"}
        aria-expanded={isOpen}
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
        <div 
          className="p-4" 
          data-state={isOpen ? "open" : "closed"}
        >
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          )}
          
          {hasLoaded && !isLoading && children}
        </div>
      )}
    </div>
  );
};
