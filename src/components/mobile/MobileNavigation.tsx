
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, FileText, Activity, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, isSigningOut } = useAuth();
  const isMobile = useIsMobile();

  // Only check if user exists, not isMobile, so navigation appears on all mobile screens
  if (!user) {
    return null;
  }

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isSigningOut) return;
    
    try {
      await signOut();
      // Navigation will be handled by AuthService
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("There was a problem signing you out. Please try again.");
    }
  };

  // Always navigate directly to chat page
  const handleChatClick = () => {
    navigate('/chat');
  };
  
  // Get correct patient prescriptions path
  const getPrescriptionsPath = () => {
    if (userRole === 'patient' && user?.id) {
      return `/prescriptions/${user.id}`;
    }
    return '/patient-prescriptions';
  };
  
  const patientNavItems = [
    {
      label: 'Chat',
      icon: MessageCircle,
      action: handleChatClick,
      active: location.pathname === '/dashboard' || location.pathname === '/chat',
      disabled: false
    },
    {
      label: 'Prescription',
      icon: FileText,
      action: () => navigate(getPrescriptionsPath()),
      active: location.pathname.includes('/prescriptions'),
      disabled: false
    },
    {
      label: 'Habits',
      icon: Activity,
      action: () => navigate('/patient-habits'),
      active: location.pathname === '/patient-habits',
      disabled: false
    },
    {
      label: 'Profile',
      icon: UserRound,
      action: () => navigate('/patient-profile'),
      active: location.pathname === '/patient-profile',
      disabled: false
    },
    {
      label: 'Sign Out',
      icon: LogOut,
      action: handleSignOut,
      active: false,
      disabled: isSigningOut
    }
  ];
  
  const otherRoleNavItems = [
    {
      label: 'Chat',
      icon: MessageCircle,
      action: () => navigate('/chat'),
      active: location.pathname === '/chat',
      disabled: false
    },
    {
      label: 'Profile',
      icon: UserRound,
      action: () => navigate('/dashboard'),
      active: location.pathname === '/dashboard',
      disabled: false
    },
    {
      label: 'Sign Out',
      icon: LogOut,
      action: handleSignOut,
      active: false,
      disabled: isSigningOut
    }
  ];
  
  let navItems = userRole === 'patient' ? patientNavItems : otherRoleNavItems;

  // Only render the navigation if on a mobile device, this is key to ensure it's displayed
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-white/20 p-2 flex justify-around items-center animate-fade-up">
      {navItems.map((item) => (
        <button
          key={item.label}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
            item.active 
              ? "bg-[#9b87f5]/20 text-[#7E69AB]" 
              : "text-gray-600 hover:text-[#7E69AB]",
            (item.disabled || (item.label === 'Sign Out' && isSigningOut)) && "opacity-50 pointer-events-none"
          )}
          onClick={item.action}
          aria-label={item.label}
          disabled={item.disabled || (item.label === 'Sign Out' && isSigningOut)}
        >
          <item.icon className="h-5 w-5 mb-1" />
          <span className="text-xs">{isSigningOut && item.label === 'Sign Out' ? 'Signing Out...' : item.label}</span>
        </button>
      ))}
    </nav>
  );
};
