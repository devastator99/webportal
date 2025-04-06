
import * as React from "react"

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

// iPad detection hook
export function useIsIPad() {
  const [isIPad, setIsIPad] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkIfIPad = () => {
      // iPad typically has width between 768px and 1024px
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Better iPad detection using both dimensions and aspect ratio
      const isTabletDevice = 
        (width >= 768 && width <= 1024) || 
        (height >= 768 && height <= 1024 && width / height < 1.2 && width / height > 0.6);
        
      setIsIPad(isTabletDevice)
    }
    
    checkIfIPad()
    window.addEventListener("resize", checkIfIPad)
    
    return () => window.removeEventListener("resize", checkIfIPad)
  }, [])

  return isIPad !== undefined ? isIPad : false
}
