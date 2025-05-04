
import React from 'react';
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type MenuItemProps = {
  icon: React.ElementType;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  disabled?: boolean;
};

export interface MobileMoreMenuProps {
  items: MenuItemProps[];
  trigger?: React.ReactNode;
  title?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function MobileMoreMenu({
  items,
  trigger,
  title = "More Options",
  isOpen,
  onOpenChange,
  className
}: MobileMoreMenuProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      
      <SheetContent 
        side="bottom" 
        className={cn("glass-nav border-t border-white/20 pb-safe rounded-t-xl", className)}
      >
        <div className="py-4">
          {title && <h3 className="text-center font-medium text-lg mb-4 text-[#7E69AB]">{title}</h3>}
          <div className="grid grid-cols-3 gap-4 px-2">
            {items.map((item, index) => (
              <button
                key={index}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                  item.active 
                    ? "bg-[#9b87f5]/20 text-[#7E69AB]" 
                    : "text-gray-600 hover:bg-[#E5DEFF] hover:text-[#7E69AB]",
                  item.disabled && "opacity-50 pointer-events-none"
                )}
                onClick={item.onClick}
                disabled={item.disabled}
              >
                <item.icon className="h-6 w-6 mb-2" />
                <span className="text-xs text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MoreButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-gray-600 hover:text-[#7E69AB]"
    >
      <MoreHorizontal className="h-5 w-5 mb-1" />
      <span className="text-xs">More</span>
    </Button>
  );
}
