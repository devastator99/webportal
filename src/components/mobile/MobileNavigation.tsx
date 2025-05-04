import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, FileText, Activity, Home, Video, UserRound, LogOut, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobileOrIPad } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import '@/styles/glass.css';
import { ModernTabBar } from '@/components/navigation/ModernTabBar';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, isSigningOut } = useAuth();
  const isMobileOrTablet = useIsMobileOrIPad();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

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
      setIsMoreMenuOpen(false);
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
  
  // Define all available navigation items
  const allPatientNavItems = [
    {
      label: 'Dashboard',
      icon: Home,
      action: () => navigate('/dashboard'),
      active: isPathActive('/dashboard'),
      disabled: false,
      priority: 'high'
    },
    {
      label: 'Chat',
      icon: MessageCircle,
      action: () => navigate('/chat'),
      active: isPathActive('/chat'),
      disabled: false,
      priority: 'high'
    },
    {
      label: 'Prescription',
      icon: FileText,
      action: () => navigate('/prescriptions'),
      active: isPathActive('/prescriptions'),
      disabled: false,
      priority: 'medium'
    },
    {
      label: 'Habits',
      icon: Activity,
      action: () => navigate('/patient-habits'),
      active: isPathActive('/patient-habits'),
      disabled: false,
      priority: 'medium'
    },
    {
      label: 'Videos',
      icon: Video,
      action: () => navigate('/videos'),
      active: isPathActive('/videos'),
      disabled: false,
      priority: 'low'
    },
    {
      label: 'Profile',
      icon: UserRound,
      action: () => navigate('/patient-profile'),
      active: isPathActive('/patient-profile'),
      disabled: false,
      priority: 'low'
    },
    {
      label: 'Sign Out',
      icon: LogOut,
      action: handleSignOut,
      active: false,
      disabled: isSigningOut,
      priority: 'low'
    }
  ];
  
  const allOtherRoleNavItems = [
    {
      label: 'Dashboard',
      icon: Home,
      action: () => navigate('/dashboard'),
      active: isPathActive('/dashboard'),
      disabled: false,
      priority: 'high'
    },
    {
      label: 'Chat',
      icon: MessageCircle,
      action: () => navigate('/chat'),
      active: isPathActive('/chat'),
      disabled: false,
      priority: 'high'
    },
    {
      label: 'Videos',
      icon: Video,
      action: () => navigate('/videos'),
      active: isPathActive('/videos'),
      disabled: false,
      priority: 'medium'
    },
    {
      label: 'Profile',
      icon: UserRound,
      action: () => navigate('/user-profile'),
      active: isPathActive('/user-profile'),
      disabled: false,
      priority: 'medium'
    },
    {
      label: 'Sign Out',
      icon: LogOut,
      action: handleSignOut,
      active: false,
      disabled: isSigningOut,
      priority: 'low'
    }
  ];

  // For non-authenticated users with minimal navigation
  const guestNavItems = [
    {
      label: 'Home',
      icon: Home,
      action: () => navigate('/'),
      active: isPathActive('/'),
      disabled: false,
      priority: 'high'
    },
    {
      label: 'Login',
      icon: LogOut,
      action: () => navigate('/auth'),
      active: isPathActive('/auth'),
      disabled: false,
      priority: 'high'
    }
  ];
  
  // Get all available nav items based on user role
  const allNavItems = user 
    ? (userRole === 'patient' ? allPatientNavItems : allOtherRoleNavItems)
    : guestNavItems;
  
  // Split items into primary (shown in navbar) and secondary (shown in more menu)
  const primaryNavItems = allNavItems.filter(item => 
    item.priority === 'high' || (item.active && item.priority === 'medium')
  ).slice(0, 4); // Allow up to 4 items in the primary nav for more flexibility
  
  const secondaryNavItems = allNavItems.filter(item => 
    !primaryNavItems.includes(item)
  );

  // Add "More" button if there are secondary items
  const navbarItems = [...primaryNavItems];
  if (secondaryNavItems.length > 0) {
    navbarItems.push({
      label: 'More',
      icon: MoreHorizontal,
      action: () => setIsMoreMenuOpen(true),
      active: false,
      disabled: false,
      priority: 'high'
    });
  }

  return (
    <>
      {/* Replace the standard navigation bar with our new ModernTabBar */}
      <ModernTabBar 
        items={navbarItems.map(item => ({
          label: isSigningOut && item.label === 'Sign Out' ? 'Signing Out...' : item.label,
          icon: item.icon,
          onClick: item.action,
          active: item.active,
          disabled: item.disabled || (item.label === 'Sign Out' && isSigningOut)
        }))}
      />

      {/* More menu using Sheet component */}
      <Sheet open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
        <SheetContent side="bottom" className="glass-nav border-t border-white/20 pb-safe rounded-t-xl">
          <div className="py-4">
            <h3 className="text-center font-medium text-lg mb-4 text-[#7E69AB]">More Options</h3>
            <div className="grid grid-cols-3 gap-4 px-2">
              {secondaryNavItems.map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                    item.active 
                      ? "bg-[#9b87f5]/20 text-[#7E69AB]" 
                      : "text-gray-600 hover:bg-[#E5DEFF] hover:text-[#7E69AB]",
                    (item.disabled || (item.label === 'Sign Out' && isSigningOut)) && "opacity-50 pointer-events-none"
                  )}
                  onClick={(e) => {
                    item.action(e);
                    if (item.label !== 'Sign Out') {
                      setIsMoreMenuOpen(false);
                    }
                  }}
                  aria-label={item.label}
                  disabled={item.disabled || (item.label === 'Sign Out' && isSigningOut)}
                >
                  <item.icon className="h-6 w-6 mb-2" />
                  <span className="text-xs text-center">{isSigningOut && item.label === 'Sign Out' ? 'Signing Out...' : item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
