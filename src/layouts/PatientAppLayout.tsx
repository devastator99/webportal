
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
          
          <main className="flex-1 w-full">
            <div className={`w-full ${isMobile ? "pt-16" : "pt-20"} px-4 md:px-6 pb-8`}>
              {showHeader && title && (
                <div className="mb-6">
                  <h1 className="text-2xl font-bold">{title}</h1>
                  {description && <p className="text-muted-foreground">{description}</p>}
                </div>
              )}
              <div className="w-full max-w-full">
                {children}
              </div>
            </div>
          </main>
          
          {isMobileOrTablet && <MobileNavigation />}
        </div>
      </SidebarProvider>
    </AppLayout>
  );
}
