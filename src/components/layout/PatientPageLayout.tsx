
import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PatientSidebar } from "@/components/dashboard/patient/PatientSidebar";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useIsMobile, useIsMobileOrIPad } from "@/hooks/use-mobile";

interface PatientPageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showHeader?: boolean;
}

export const PatientPageLayout = ({
  children,
  title,
  description,
  showHeader = true,
}: PatientPageLayoutProps) => {
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrIPad();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PatientSidebar />
        <div className={`flex-1 ${isMobileOrTablet ? "pb-20" : "pb-8"}`}>
          <div className={`container ${isMobile ? "pt-16 pb-24" : "pt-20 pb-8"} px-4`}>
            {showHeader && title && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
        {isMobileOrTablet && <MobileNavigation />}
      </div>
    </SidebarProvider>
  );
};
