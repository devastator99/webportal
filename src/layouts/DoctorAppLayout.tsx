
import { ReactNode } from "react";
import { AppLayout } from "./AppLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DoctorSidebar } from "@/components/dashboard/doctor/DoctorSidebar";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useIsMobileOrIPad } from "@/hooks/use-mobile";

interface DoctorAppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  title?: string;
  description?: string;
  fullWidth?: boolean; // Added fullWidth prop to match PatientAppLayout
}

export function DoctorAppLayout({
  children,
  showHeader = false,
  title,
  description,
  fullWidth = false, // Added with default value of false
}: DoctorAppLayoutProps) {
  const isMobileOrTablet = useIsMobileOrIPad();

  return (
    <AppLayout>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <DoctorSidebar />
          
          <div className={`flex-1 ${isMobileOrTablet ? "pb-20" : "pb-8"}`}>
            <div className={`${fullWidth ? 'px-0' : 'container px-4'} pt-16 pb-8`}>
              {showHeader && title && (
                <div className={`mb-6 ${fullWidth ? 'px-4 md:px-6' : ''}`}>
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
    </AppLayout>
  );
}
