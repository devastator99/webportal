
import { ReactNode } from "react";
import { AppLayout } from "./AppLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PatientSidebar } from "@/components/dashboard/patient/PatientSidebar";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useIsMobile, useIsMobileOrIPad } from "@/hooks/use-mobile";

interface PatientAppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  title?: string;
  description?: string;
}

export function PatientAppLayout({
  children,
  showHeader = false,
  title,
  description,
}: PatientAppLayoutProps) {
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrIPad();

  return (
    <AppLayout>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <PatientSidebar />
          
          <div className="flex-1 w-0 min-w-0 overflow-x-hidden">
            <div className={`w-full ${isMobileOrTablet ? "pb-20" : "pb-8"}`}>
              <div className={`container max-w-full ${isMobile ? "pt-16" : "pt-20"} px-4 pb-8`}>
                {showHeader && title && (
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold">{title}</h1>
                    {description && <p className="text-muted-foreground">{description}</p>}
                  </div>
                )}
                {children}
              </div>
            </div>
          </div>
          
          {isMobileOrTablet && <MobileNavigation />}
        </div>
      </SidebarProvider>
    </AppLayout>
  );
}
