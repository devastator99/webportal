
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, FileText, Activity, Home, Video, UserRound, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobileOrIPad } from '@/hooks/use-mobile';
import '@/styles/glass.css';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, isSigningOut } = useAuth();
  const isMobileOrTablet = useIsMobileOrIPad();

  // Always render for mobile and tablet users, regardless of auth status
  if (!isMobileOrTablet) {
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

  // Function to check if a path is active, including handling nested routes
  const isPathActive = (path: string): boolean => {
    if (path === '/videos' && location.pathname === '/videos') {
      return true;
    }

    // For prescriptions path, match any route that includes /prescriptions/
    if (path.includes('/prescriptions') && location.pathname.includes('/prescriptions')) {
      return true;
    }
    
    // For user profile, match both /patient-profile and /notifications
    if (path === '/patient-profile' && 
        (location.pathname === '/patient-profile' || location.pathname === '/notifications')) {
      return true;
    }
    
    // Default exact matching for other routes
    return location.pathname === path;
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
      label: 'Dashboard',
      icon: Home,
      action: () => navigate('/dashboard'),
      active: isPathActive('/dashboard'),
      disabled: false
    },
    {
      label: 'Chat',
      icon: MessageCircle,
      action: () => navigate('/chat'),
      active: isPathActive('/chat'),
      disabled: false
    },
    {
      label: 'Prescription',
      icon: FileText,
      action: () => navigate(getPrescriptionsPath()),
      active: isPathActive('/prescriptions'),
      disabled: false
    },
    {
      label: 'Habits',
      icon: Activity,
      action: () => navigate('/patient-habits'),
      active: isPathActive('/patient-habits'),
      disabled: false
    },
    {
      label: 'Videos',
      icon: Video,
      action: () => {
        console.log('MobileNavigation: Navigating to /videos');
        navigate('/videos');
      },
      active: isPathActive('/videos'),
      disabled: false
    },
    {
      label: 'Profile',
      icon: UserRound,
      action: () => navigate('/patient-profile'),
      active: isPathActive('/patient-profile'),
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
      label: 'Dashboard',
      icon: Home,
      action: () => navigate('/dashboard'),
      active: isPathActive('/dashboard'),
      disabled: false
    },
    {
      label: 'Chat',
      icon: MessageCircle,
      action: () => navigate('/chat'),
      active: isPathActive('/chat'),
      disabled: false
    },
    {
      label: 'Videos',
      icon: Video,
      action: () => {
        console.log('MobileNavigation: Navigating to /videos');
        navigate('/videos');
      },
      active: isPathActive('/videos'),
      disabled: false
    },
    {
      label: 'Profile',
      icon: UserRound,
      action: () => navigate('/user-profile'),
      active: isPathActive('/user-profile'),
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
  
  // Handle non-authenticated users with a minimal navigation
  let navItems = user 
    ? (userRole === 'patient' ? patientNavItems : otherRoleNavItems)
    : [
        {
          label: 'Home',
          icon: Home,
          action: () => navigate('/'),
          active: isPathActive('/'),
          disabled: false
        }
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-white/20 p-2 flex justify-around items-center animate-fade-up">
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
