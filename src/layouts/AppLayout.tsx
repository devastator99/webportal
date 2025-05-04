
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { MobileStatusBar } from "@/components/mobile/MobileStatusBar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useIsMobileOrIPad } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
  showNotifications?: boolean;
}

export function AppLayout({ children, showNotifications = true }: AppLayoutProps) {
  const isMobileOrTablet = useIsMobileOrIPad();
  const { user } = useAuth();

  return (
    <>
      <MobileStatusBar />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
        {showNotifications && user && (
          <div className="fixed right-6 bottom-6 z-30">
            <NotificationBell />
          </div>
        )}
        
        <Toaster position="top-center" />
      </div>
    </>
  );
}
