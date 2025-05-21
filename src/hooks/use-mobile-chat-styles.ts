
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";

export function useMobileChatStyles() {
  const { isMobile, isTablet } = useResponsive();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  
  return {
    container: {
      padding: isMobile || isSmallScreen ? "px-1" : isTablet || isMediumScreen ? "px-2" : "px-4",
      maxWidth: isMobile || isSmallScreen ? "w-full" : "max-w-screen-lg mx-auto",
    },
    messageBubble: {
      maxWidth: isMobile || isSmallScreen ? "max-w-[90%]" : "max-w-[80%]",
      padding: isMobile || isSmallScreen ? "p-2" : "p-3",
    },
    spacing: {
      messageGap: isMobile || isSmallScreen ? "space-y-2" : "space-y-4",
      sectionPadding: isMobile || isSmallScreen ? "p-2" : "p-4",
    },
    text: {
      fontSize: isMobile || isSmallScreen ? "text-sm" : "text-base",
      timestampSize: isMobile || isSmallScreen ? "text-[10px]" : "text-xs",
    }
  };
}
