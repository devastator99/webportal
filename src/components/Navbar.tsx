
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Logo } from "@/components/navbar/Logo";
import { DashboardButton } from "@/components/navbar/DashboardButton";
import { DoctorActions } from "@/components/navbar/DoctorActions";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { SignOutButton } from "@/components/navbar/SignOutButton";
import { ForceLogoutButton } from "@/components/navbar/ForceLogoutButton";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const { user, isLoading, resetInactivityTimer } = useAuth();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  
  const isDashboardPage = location.pathname === '/dashboard';
  const isAdminPage = location.pathname === '/admin';
  const isAlternativeDashboard = location.pathname === '/dashboard-alt';

  // Enhanced navbar styling with improved visibility and spacing
  const navbarClass = "fixed top-0 w-full bg-white dark:bg-gray-900 z-50 border-b border-[#D6BCFA] shadow-lg";

  useEffect(() => {
    resetInactivityTimer();
  }, [location.pathname, resetInactivityTimer]);

  // Close mobile menu when changing routes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Use either mobile or iPad display logic
  const useResponsiveDisplay = isMobile || isIPad;

  if (isLoading && !isSigningOut && location.pathname !== '/') {
    return (
      <nav className={navbarClass}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo />
        </div>
      </nav>
    );
  }

  return (
    <nav className={navbarClass}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />
        
        {/* Mobile/iPad menu button */}
        {useResponsiveDisplay && (
          <Button
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
        
        {/* Desktop navigation - increased visibility */}
        <div className={`${useResponsiveDisplay ? 'hidden' : 'flex'} items-center gap-4`}>
          {user && <DashboardButton />}
          {user && <DoctorActions />}
          {user && isAdminPage && <ForceLogoutButton />}
          {!user && (
            <div className="flex-shrink-0">
              <LoginDialog />
            </div>
          )}
          {user && <SignOutButton />}
        </div>
        
        {/* Mobile/iPad navigation - improved layout */}
        {useResponsiveDisplay && mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-[#D6BCFA] shadow-lg z-50 py-4 px-4">
            <div className="flex flex-col gap-3">
              {user && <DashboardButton />}
              {user && <DoctorActions />}
              {user && isAdminPage && <ForceLogoutButton />}
              {!user && (
                <div className="flex justify-start my-2">
                  <LoginDialog />
                </div>
              )}
              {user && <SignOutButton />}
            </div>
          </div>
        )}
        
        {/* Always show login button for mobile/iPad when menu is closed */}
        {useResponsiveDisplay && !mobileMenuOpen && !user && (
          <div className="flex-shrink-0">
            <LoginDialog />
          </div>
        )}
      </div>
    </nav>
  );
};
