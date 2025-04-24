
import { useAuth, UserRoleEnum } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { Logo } from "@/components/navbar/Logo";
import { DashboardButton } from "@/components/navbar/DashboardButton";
import { DoctorActions } from "@/components/navbar/DoctorActions";
import { AuthButton } from "@/components/auth/AuthButton";
import { ForceLogoutButton } from "@/components/navbar/ForceLogoutButton";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export const Navbar = () => {
  const { user, isLoading, userRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();

  const isDashboardPage = location.pathname === '/dashboard';
  const isAuthPage = location.pathname === '/auth';
  const useResponsiveDisplay = isMobile || isIPad;

  return (
    <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-[#D6BCFA] shadow-sm z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Logo />
          
          {/* Desktop navigation */}
          <div className={`${useResponsiveDisplay ? 'hidden' : 'flex'} items-center gap-4`}>
            {user && !isLoading && (
              <>
                <DashboardButton />
                <DoctorActions />
                {userRole === UserRoleEnum.ADMINISTRATOR && <ForceLogoutButton />}
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
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-[#D6BCFA] shadow-lg">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
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
