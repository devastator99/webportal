
import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query";

// Update the breakpoint to include iPads (most iPads are 768px or higher)
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Initial check
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check immediately
    checkIfMobile()
    
    // Add resize listener
    window.addEventListener("resize", checkIfMobile)
    
    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return isMobile !== undefined ? isMobile : false
}

// Improved iPad detection hook with more reliable detection
export function useIsIPad() {
  // Use media query for more reliable iPad detection
  const isTabletOrLarger = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
  const isPortraitOrientation = useMediaQuery("(orientation: portrait)");
  
  // Additional check for iPad-specific dimensions
  const [isAppleTablet, setIsAppleTablet] = React.useState<boolean>(false);
  
  React.useEffect(() => {
    const checkIfIPad = () => {
      // iPad typically has width between 768px and 1024px
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Improved iPad detection using dimensions, aspect ratio and user agent
      const isTabletDimensions = 
        (width >= 768 && width <= 1024) || 
        (height >= 768 && height <= 1024 && width / height < 1.2 && width / height > 0.6);
      
      // Check for iPad in user agent (though this is not always reliable)
      const userAgent = navigator.userAgent.toLowerCase();
      const isPadiOS = /ipad/.test(userAgent) || 
                      (/macintosh/.test(userAgent) && 'ontouchend' in document);
      
      setIsAppleTablet(isTabletDimensions || isPadiOS);
    };
    
    checkIfIPad();
    window.addEventListener("resize", checkIfIPad);
    
    return () => window.removeEventListener("resize", checkIfIPad);
  }, []);

  // Consider a device an iPad if either condition is true
  return isTabletOrLarger || isAppleTablet;
}
