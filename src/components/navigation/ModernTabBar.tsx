
import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TabItem {
  label: string;
  icon: React.ElementType;
  onClick: (e: React.MouseEvent) => void;
  active: boolean;
  disabled?: boolean;
}

interface ModernTabBarProps {
  items: TabItem[];
  className?: string;
}

export const ModernTabBar: React.FC<ModernTabBarProps> = ({ items, className }) => {
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    return items.findIndex(item => item.active) || 0;
  });
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  
  // Update indicator position when active item changes
  useEffect(() => {
    if (indicatorRef.current && itemRefs.current[activeIndex]) {
      const activeItem = itemRefs.current[activeIndex];
      const container = activeItem?.parentElement;
      
      if (activeItem && container) {
        const itemRect = activeItem.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Position the indicator relative to the active item
        indicatorRef.current.style.width = `${itemRect.width}px`;
        indicatorRef.current.style.left = `${itemRect.left - containerRect.left}px`;
      }
    }
  }, [activeIndex, items]);
  
  // Update activeIndex when the active prop changes
  useEffect(() => {
    const newActiveIndex = items.findIndex(item => item.active);
    if (newActiveIndex !== -1 && newActiveIndex !== activeIndex) {
      setActiveIndex(newActiveIndex);
    }
  }, [items, activeIndex]);
  
  const handleItemClick = (index: number, onClick: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
    setActiveIndex(index);
    onClick(e);
  };
  
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-40 mx-auto px-4 pb-1 animate-fade-up",
      className
    )}>
      <div className="relative flex items-center justify-around max-w-md mx-auto rounded-full p-1.5 glass-nav shadow-lg">
        {/* Animated indicator */}
        <div 
          ref={indicatorRef}
          className="absolute h-[85%] bg-[#9b87f5]/20 rounded-full transition-all duration-300 ease-in-out"
        />
        
        {/* Tab items */}
        {items.map((item, index) => (
          <button
            key={item.label}
            ref={el => itemRefs.current[index] = el}
            className={cn(
              "relative flex flex-col items-center justify-center py-2 px-4 rounded-full transition-all duration-300 z-10",
              item.active 
                ? "text-[#7E69AB] scale-105" 
                : "text-gray-500 hover:text-[#7E69AB]/80",
              item.disabled && "opacity-50 pointer-events-none"
            )}
            onClick={handleItemClick(index, item.onClick)}
            disabled={item.disabled}
          >
            <item.icon className={cn(
              "transition-all duration-300",
              item.active ? "h-5 w-5 mb-1" : "h-4 w-4 mb-0.5"
            )} />
            <span className={cn(
              "text-[10px] font-medium transition-all duration-300",
              item.active ? "opacity-100" : "opacity-80"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
