
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";

export const PatientHeader = () => {
  const { isTablet, isMobile } = useResponsive();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  
  return (
    <div className={`${
      isSmallScreen || isMobile 
        ? "pt-4 pb-2" 
        : isTablet || isMediumScreen 
          ? "pt-6 pb-3" 
          : "pt-8 pb-4"
    }`}>
      <DashboardHeader />
    </div>
  );
};
