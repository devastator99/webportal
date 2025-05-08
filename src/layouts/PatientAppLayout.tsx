
import { ReactNode } from "react";
import { AppLayout } from "./AppLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PatientSidebar } from "@/components/dashboard/patient/PatientSidebar";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useIsMobile, useIsMobileOrIPad } from "@/hooks/use-mobile";
import '@/components/ui/sidebar-variables.css';

interface PatientAppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  title?: string;
  description?: string;
  fullWidth?: boolean;
}

export function PatientAppLayout({
  children,
  showHeader = false,
  title,
  description,
  fullWidth = false,
}: PatientAppLayoutProps) {
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrIPad();

  return (
    <AppLayout>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <PatientSidebar />
          
          <main className="flex-1 w-full overflow-x-hidden">
            <div className="w-full h-full">
              <div className={`w-full ${isMobile ? "pt-16" : "pt-20"} ${fullWidth ? 'px-0' : 'px-4 md:px-6'} pb-8`}>
                {showHeader && title && (
                  <div className={`mb-6 w-full ${fullWidth ? 'px-4 md:px-6' : ''}`}>
                    <h1 className="text-2xl font-bold text-[#7E69AB]">{title}</h1>
                    {description && <p className="text-muted-foreground">{description}</p>}
                  </div>
                )}
                <div className={`w-full ${isMobileOrTablet ? 'pb-32' : ''}`}>
                  {children}
                </div>
              </div>
            </div>
          </main>
          
          {isMobileOrTablet && <MobileNavigation />}
        </div>
      </SidebarProvider>
    </AppLayout>
  );
}
