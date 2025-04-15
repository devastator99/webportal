
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useIsIPad } from "@/hooks/use-mobile";

interface CollapsibleSectionProps {
  title: string;
  className?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  lazyLoad?: boolean;
  id?: string; // Add this optional id prop
}

export const CollapsibleSection = ({
  title,
  className,
  defaultOpen = false,
  children,
  lazyLoad = true,
  id, // Include id in component props
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasLoaded, setHasLoaded] = useState(defaultOpen);
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { resetInactivityTimer } = useAuth();
  const isIPad = useIsIPad();

  // Optimized toggle function with animation frame scheduling
  const handleToggle = () => {
    resetInactivityTimer();
    
    if (!isOpen && !hasLoaded && lazyLoad) {
      setIsLoading(true);
      
      // Use requestAnimationFrame to schedule UI updates
      requestAnimationFrame(() => {
        setIsOpen(true);
        
        // Very short timeout for smoother transition feeling
        setTimeout(() => {
          setHasLoaded(true);
          setIsLoading(false);
        }, 10);
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
    <div 
      className={cn("rounded-lg border bg-card shadow-sm", 
        isIPad ? "overflow-hidden max-w-full" : "", 
        className
      )} 
      style={{contain: "content"}}
      id={id} // Add the id prop here
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={handleToggle}
        data-state={isOpen ? "open" : "closed"}
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-medium">{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      
      {isOpen && <Separator />}
      
      {isOpen && (
        <div 
          ref={contentRef}
          className={cn("p-4", isIPad ? "overflow-x-auto" : "")}
          data-state={isOpen ? "open" : "closed"}
          style={{ 
            willChange: "transform, opacity",
            contain: "content"
          }}
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
