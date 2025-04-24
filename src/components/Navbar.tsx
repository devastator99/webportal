
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
import { Spinner } from "@/components/ui/spinner";

export const Navbar = () => {
  const { user, isLoading, userRole } = useAuth();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();

  const isDashboardPage = location.pathname === '/dashboard';
  const isAuthPage = location.pathname === '/auth';
  const useResponsiveDisplay = isMobile || isIPad;

  // Enhanced navbar styling with explicit z-index and shadow
  const navbarClass = "fixed top-0 w-full bg-white dark:bg-gray-900 z-[100] border-b border-[#D6BCFA] shadow-lg";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const renderAuthButton = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-9">
          <Spinner size="sm" className="text-[#9b87f5]" />
        </div>
      );
    }
    
    if (user) {
      return (
        <SignOutButton 
          onSignOutStart={() => setIsSigningOut(true)} 
          onSignOutEnd={() => setIsSigningOut(false)} 
        />
      );
    }
    
    if (!isAuthPage) {
      return <LoginDialog />;
    }
    
    return null;
  };

  // Always show the auth button regardless of screen size
  const authButton = renderAuthButton();

  return (
    <nav className={navbarClass}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center relative">
        <Logo />
        
        {/* Desktop navigation with improved z-index */}
        <div className={`${useResponsiveDisplay ? 'hidden' : 'flex'} items-center gap-4 z-[101]`}>
          {user && !isLoading && (
            <>
              <DashboardButton />
              <DoctorActions />
              {userRole === UserRoleEnum.ADMINISTRATOR && <ForceLogoutButton />}
            </>
          )}
          {authButton}
        </div>

        {/* Mobile menu button and auth button with improved visibility */}
        {useResponsiveDisplay && (
          <div className="flex items-center gap-2 z-[101]">
            {authButton}
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="relative z-[102]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        )}
        
        {/* Enhanced mobile menu dropdown with proper z-index */}
        {useResponsiveDisplay && mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-[#D6BCFA] shadow-lg z-[99] py-4 px-4">
            <div className="flex flex-col gap-3">
              {user && !isLoading && (
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
