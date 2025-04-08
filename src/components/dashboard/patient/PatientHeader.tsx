
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useIsIPad } from "@/hooks/use-mobile";

export const PatientHeader = () => {
  const isIPad = useIsIPad();
  
  return (
    <div className={`${isIPad ? "pt-16" : "pt-16 md:pt-20"}`}>
      <DashboardHeader />
    </div>
  );
};
