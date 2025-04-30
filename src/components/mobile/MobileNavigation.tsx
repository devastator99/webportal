
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, FileText, Activity, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, isSigningOut } = useAuth();
  const [careTeamRoomId, setCareTeamRoomId] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user?.id && userRole === 'patient') {
      setIsLoadingRoom(true);
      const fetchCareTeamRoom = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-patient-care-team-room', {
            body: { patient_id: user.id }
          });
          
          if (error) {
            console.error("Failed to get care team chat room:", error);
          } else if (typeof data === "string" && data) {
            setCareTeamRoomId(data);
          } else if (typeof data === "object" && data !== null && data.id) {
            setCareTeamRoomId(data.id);
          } else if (typeof data === "object" && data !== null && "room_id" in data) {
            setCareTeamRoomId(data.room_id);
          } 
        } catch (err) {
          console.error("Error fetching care team chat room:", err);
        } finally {
          setIsLoadingRoom(false);
        }
      };
      
      fetchCareTeamRoom();
    }
  }, [user, userRole]);

  if (!user || !isMobile) {
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

  const handleChatClick = () => {
    if (userRole === 'patient') {
      if (!careTeamRoomId && !isLoadingRoom) {
        toast.error("You don't have a care team assigned yet.");
        return;
      }
      
      navigate('/dashboard');
    } else {
      navigate('/chat');
    }
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
      disabled: isLoadingRoom
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/10 backdrop-blur-lg border-t border-white/20 p-2 flex justify-around items-center animate-fade-up">
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
