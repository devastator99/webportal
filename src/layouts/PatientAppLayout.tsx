
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
  fullScreenChat?: boolean; // New prop for full-screen chat mode
}

export function PatientAppLayout({
  children,
  showHeader = false,
  title,
  description,
  fullWidth = false,
  fullScreenChat = false, // Initialize with default value
}: PatientAppLayoutProps) {
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrIPad();

  // Apply special classes for full-screen chat mode on mobile
  const mainContentClasses = fullScreenChat && isMobileOrTablet 
    ? "chat-fullscreen-content" 
    : `w-full ${isMobile ? "pt-16" : "pt-20"} ${fullWidth ? 'px-0' : 'px-4 md:px-6'} pb-8`;

  return (
    <AppLayout>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          {!fullScreenChat && <PatientSidebar />}
          
          <main className={`flex-1 w-full overflow-x-hidden ${fullScreenChat ? 'chat-fullscreen-main' : ''}`}>
            <div className="w-full h-full">
              <div className={mainContentClasses}>
                {showHeader && title && !fullScreenChat && (
                  <div className={`mb-6 w-full ${fullWidth ? 'px-4 md:px-6' : ''}`}>
                    <h1 className="text-2xl font-bold text-[#7E69AB]">{title}</h1>
                    {description && <p className="text-muted-foreground">{description}</p>}
                  </div>
                )}
                <div className={`w-full ${isMobileOrTablet && !fullScreenChat ? 'pb-32' : ''}`}>
                  {children}
                </div>
              </div>
            </div>
          </main>
          
          {isMobileOrTablet && !fullScreenChat && <MobileNavigation />}
        </div>
      </SidebarProvider>
    </AppLayout>
  );
}
