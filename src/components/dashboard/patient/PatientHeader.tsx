
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";

export const PatientHeader = () => {
  const { isTablet, isMobile } = useResponsive();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  
  return (
    <div className={`sticky top-0 z-10 bg-background/95 backdrop-blur-sm w-full ${
      isSmallScreen || isMobile 
        ? "pt-2 pb-2" 
        : isTablet || isMediumScreen 
          ? "pt-3 pb-2" 
          : "pt-4 pb-2"
    }`}>
      <DashboardHeader />
    </div>
  );
};
