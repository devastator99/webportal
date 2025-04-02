
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
import { useState as useHookState } from "react";

export const Navbar = () => {
  const { user, isLoading, resetInactivityTimer } = useAuth();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useHookState(false);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  
  const isDashboardPage = location.pathname === '/dashboard';
  const isAdminPage = location.pathname === '/admin';
  const isAlternativeDashboard = location.pathname === '/dashboard-alt';

  const navbarClass = (isDashboardPage || isAlternativeDashboard)
    ? "fixed top-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-md z-50 border-b border-[#D6BCFA] shadow-sm mb-16" 
    : "fixed top-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-md z-50 border-b border-[#D6BCFA] shadow-sm";

  useEffect(() => {
    resetInactivityTimer();
  }, [location.pathname, resetInactivityTimer]);

  // Close mobile menu when changing routes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  // Use either mobile or iPad display logic
  const useResponsiveDisplay = isMobile || isIPad;

  if (isLoading && !isSigningOut && location.pathname !== '/') {
    return (
      <nav className={navbarClass}>
        <div className="container mx-auto px-4 py-2.5 flex justify-between items-center">
          <Logo />
        </div>
      </nav>
    );
  }

  return (
    <nav className={navbarClass}>
      <div className="container mx-auto px-4 py-2.5 flex justify-between items-center">
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
        
        {/* Desktop navigation */}
        <div className={`${useResponsiveDisplay ? 'hidden' : 'flex'} items-center gap-3`}>
          {user && <DashboardButton />}
          {user && <DoctorActions />}
          {user && isAdminPage && <ForceLogoutButton />}
          {!user && <LoginDialog />}
          {user && <SignOutButton />}
        </div>
        
        {/* Mobile/iPad navigation */}
        {useResponsiveDisplay && mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-[#D6BCFA] shadow-md z-50 py-3 px-4">
            <div className="flex flex-col gap-2">
              {user && <DashboardButton />}
              {user && <DoctorActions />}
              {user && isAdminPage && <ForceLogoutButton />}
              {!user && <LoginDialog />}
              {user && <SignOutButton />}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
