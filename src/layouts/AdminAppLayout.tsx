
import { ReactNode } from "react";
import { AppLayout } from "./AppLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/dashboard/admin/AdminSidebar";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useIsMobileOrIPad } from "@/hooks/use-mobile";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { SyncCareTeamsButton } from "@/components/dashboard/admin/SyncCareTeamsButton";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminAppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  title?: string;
  description?: string;
  fullWidth?: boolean;
}

export function AdminAppLayout({
  children,
  showHeader = false,
  title,
  description,
  fullWidth = false,
}: AdminAppLayoutProps) {
  const isMobileOrTablet = useIsMobileOrIPad();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
          
          <div className={`flex-1 ${isMobileOrTablet ? "pb-20" : "pb-8"}`}>
            {/* Header with navigation buttons - Always visible */}
            <div className="bg-white dark:bg-gray-950 pt-4 pb-3 border-b shadow-sm">
              <div className="container mx-auto px-4">
                <div className="flex flex-row items-center justify-between gap-3">
                  <div className="flex-1">
                    {showHeader && title && (
                      <div>
                        <h1 className="text-2xl font-bold">{title}</h1>
                        {description && <p className="text-muted-foreground">{description}</p>}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/testing')}
                      className="flex items-center gap-2"
                    >
                      <Wrench className="h-4 w-4" />
                      Testing Tools
                    </Button>
                    
                    <SyncCareTeamsButton />
                    
                    <SignOutButton 
                      variant="outline" 
                      size="sm" 
                      className="font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`${fullWidth ? 'px-0' : 'container px-4'} pt-4 pb-8`}>
              {children}
            </div>
          </div>
          
          {isMobileOrTablet && <MobileNavigation />}
        </div>
      </SidebarProvider>
    </AppLayout>
  );
}
