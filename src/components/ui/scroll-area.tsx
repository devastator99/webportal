
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  orientation?: "vertical" | "horizontal" | "both";
  viewportRef?: React.RefObject<HTMLDivElement>;
  invisibleScrollbar?: boolean;
  maxHeight?: string;
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, orientation = "vertical", viewportRef, invisibleScrollbar = false, maxHeight, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport 
      ref={viewportRef}
      style={{
        maxHeight: maxHeight,
        height: "100%",
        WebkitOverflowScrolling: "touch",
        overflowY: invisibleScrollbar ? "auto" : undefined,
      }}
      className={cn(
        "h-full w-full rounded-[inherit]",
        invisibleScrollbar ? "invisible-scroll scrollbar-hide" : ""
      )}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    {!invisibleScrollbar && (orientation === "both" || orientation === "vertical") && (
      <ScrollBar orientation="vertical" />
    )}
    {!invisibleScrollbar && (orientation === "both" || orientation === "horizontal") && (
      <ScrollBar orientation="horizontal" />
    )}
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb 
      className={cn(
        "relative flex-1 rounded-full bg-border hover:bg-border/80",
        orientation === "horizontal" && "h-1.5",
        orientation === "vertical" && "w-1.5"
      )}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
