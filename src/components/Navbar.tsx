
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Logo } from "@/components/navbar/Logo";
import { DashboardButton } from "@/components/navbar/DashboardButton";
import { DoctorActions } from "@/components/navbar/DoctorActions";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { SignOutButton } from "@/components/navbar/SignOutButton";
import { ForceLogoutButton } from "@/components/navbar/ForceLogoutButton";

export const Navbar = () => {
  const { user, isLoading, resetInactivityTimer } = useAuth();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const isDashboardPage = location.pathname === '/dashboard';
  const isAdminPage = location.pathname === '/admin';
  const isAlternativeDashboard = location.pathname === '/dashboard-alt';

  const navbarClass = (isDashboardPage || isAlternativeDashboard)
    ? "fixed top-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-md z-50 border-b border-[#D6BCFA] shadow-sm mb-16" 
    : "fixed top-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-md z-50 border-b border-[#D6BCFA] shadow-sm";

  useEffect(() => {
    resetInactivityTimer();
  }, [location.pathname, resetInactivityTimer]);

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
        
        <div className="flex items-center gap-3">
          {user && <DashboardButton />}
          
          {user && <DoctorActions />}
          
          {user && isAdminPage && <ForceLogoutButton />}
          
          {!user && <LoginDialog />}
          
          {user && <SignOutButton />}
        </div>
      </div>
    </nav>
  );
};
