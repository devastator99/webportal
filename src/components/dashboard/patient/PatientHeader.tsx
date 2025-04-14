
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";

export const PatientHeader = () => {
  const { isTablet, isMobile } = useResponsive();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  
  return (
    <div className={`${
      isSmallScreen || isMobile 
        ? "pt-14" 
        : isTablet || isMediumScreen 
          ? "pt-16" 
          : "pt-16 md:pt-20"
    }`}>
      <DashboardHeader />
    </div>
  );
};
