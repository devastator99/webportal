
import { useAuth, UserRoleEnum } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Logo } from "@/components/navbar/Logo";
import { AuthButton } from "@/components/auth/AuthButton";
import { ForceLogoutButton } from "@/components/navbar/ForceLogoutButton";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import '@/styles/glass.css';

export const Navbar = () => {
  const { user, isLoading, userRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  const [scrolled, setScrolled] = useState(false);

  // Check scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Log auth state changes for debugging
  useEffect(() => {
    console.log("Navbar auth state:", { 
      user: user?.id,
      userRole, 
      isLoading,
      pathname: location.pathname
    });
  }, [user, userRole, isLoading, location.pathname]);

  const isAuthPage = location.pathname === '/auth';
  const useResponsiveDisplay = isMobile || isIPad;

  // Don't show navbar on dashboard for authenticated users
  const isDashboardRoute = location.pathname.includes('/dashboard');
  if (user && isDashboardRoute) return null;

  return (
    <nav className={`fixed top-0 w-full ${scrolled ? 'glass-nav scrolled' : 'glass-nav'} z-50`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Logo />
          
          {/* Desktop navigation */}
          <div className={`${useResponsiveDisplay ? 'hidden' : 'flex'} items-center gap-4`}>
            {user && !isLoading && (
              <>
                {userRole === UserRoleEnum.ADMINISTRATOR && <ForceLogoutButton />}
                {user.email && (
                  <span className="text-sm text-[#7E69AB] mr-2 hidden md:inline-block">
                    {user.email}
                  </span>
                )}
              </>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center h-9">
                <Spinner size="sm" className="text-[#9b87f5]" />
              </div>
            ) : (
              !isAuthPage && <AuthButton />
            )}
          </div>

          {/* Mobile navigation */}
          {useResponsiveDisplay && (
            <div className="flex items-center gap-2">
              {!isAuthPage && <AuthButton />}
              <Button
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                className="relative z-50"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {useResponsiveDisplay && mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 glass-nav">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {user && !isLoading && (
                <>
                  {userRole === UserRoleEnum.ADMINISTRATOR && <ForceLogoutButton />}
                  {user.email && (
                    <span className="text-sm text-[#7E69AB]">
                      Signed in as: {user.email}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
