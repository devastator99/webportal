
import { useAuth, UserRoleEnum } from "@/contexts/AuthContext";
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
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const { user, isLoading, resetInactivityTimer, userRole } = useAuth();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  const { toast } = useToast();

  const isDashboardPage = location.pathname === '/dashboard';
  const isAdminPage = location.pathname === '/admin';
  const isAlternativeDashboard = location.pathname === '/dashboard-alt';
  const isAuthPage = location.pathname === '/auth';

  const navbarClass = "fixed top-0 w-full bg-white dark:bg-gray-900 z-50 border-b border-[#D6BCFA] shadow-lg";

  // Only reset inactivity timer on route changes, not on every render
  useEffect(() => {
    console.log("Navbar: Route changed, resetting inactivity timer");
    resetInactivityTimer();
  }, [location.pathname, resetInactivityTimer]);

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const useResponsiveDisplay = isMobile || isIPad;

  // Debug auth state
  useEffect(() => {
    if (user) {
      console.log("Navbar: User is authenticated", { 
        userId: user.id, 
        userRole,
        path: location.pathname
      });
    } else {
      console.log("Navbar: No authenticated user", { path: location.pathname });
    }
  }, [user, userRole, location.pathname]);

  // If user exists but we're still in a loading state, show the loading navbar
  if (isLoading && !isSigningOut) {
    return (
      <nav className={navbarClass}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo />
          <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={navbarClass}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />
        
        {/* For mobile view, show menu toggle button and login if needed */}
        {useResponsiveDisplay && (
          <div className="flex items-center gap-2">
            {user && (
              <SignOutButton 
                onSignOutStart={() => setIsSigningOut(true)} 
                onSignOutEnd={() => setIsSigningOut(false)}
              />
            )}
            
            {!user && (
              <div className="flex-shrink-0 mr-2">
                <LoginDialog />
              </div>
            )}
            
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        )}
        
        {/* Desktop view navigation */}
        <div className={`${useResponsiveDisplay ? 'hidden' : 'flex'} items-center gap-4`}>
          {user && (
            <>
              <DashboardButton />
              <DoctorActions />
              {userRole === UserRoleEnum.ADMINISTRATOR && <ForceLogoutButton />}
              <SignOutButton 
                onSignOutStart={() => setIsSigningOut(true)} 
                onSignOutEnd={() => setIsSigningOut(false)} 
              />
            </>
          )}
          {!user && (
            <div className="flex-shrink-0">
              <LoginDialog />
            </div>
          )}
        </div>
        
        {/* Mobile menu dropdown */}
        {useResponsiveDisplay && mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-[#D6BCFA] shadow-lg z-50 py-4 px-4">
            <div className="flex flex-col gap-3">
              {user && (
                <>
                  <DashboardButton />
                  <DoctorActions />
                  {userRole === UserRoleEnum.ADMINISTRATOR && <ForceLogoutButton />}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
