
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, FileText, Activity, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [careTeamRoomId, setCareTeamRoomId] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);

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

  if (!user) {
    return null;
  }

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      
      toast({
        title: "Signing out...",
        description: "Please wait while we sign you out",
      });
      
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
      setIsSigningOut(false);
    }
  };

  const handleChatClick = () => {
    if (userRole === 'patient') {
      if (!careTeamRoomId && !isLoadingRoom) {
        toast({
          title: "No care team available",
          description: "You don't have a care team assigned yet.",
          variant: "destructive"
        });
        return;
      }
      
      // Navigate to dashboard since the care team chat is embedded there for patients
      navigate('/dashboard');
    } else {
      // For doctors and other roles, go to the chat page
      navigate('/chat');
    }
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
      action: () => navigate('/prescriptions/' + user.id),
      active: location.pathname.includes('/prescriptions'),
      disabled: false
    },
    {
      label: 'Habits',
      icon: Activity,
      action: () => navigate('/habits'),
      active: location.pathname === '/habits',
      disabled: false
    },
    {
      label: 'Profile',
      icon: UserRound,
      action: () => navigate('/profile'),
      active: location.pathname === '/profile',
      disabled: false
    },
    {
      label: isSigningOut ? 'Signing Out...' : 'Sign Out',
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
      action: () => navigate('/dashboard-alt'),
      active: location.pathname === '/dashboard-alt',
      disabled: false
    },
    {
      label: isSigningOut ? 'Signing Out...' : 'Sign Out',
      icon: LogOut,
      action: handleSignOut,
      active: false,
      disabled: isSigningOut
    }
  ];
  
  let navItems = userRole === 'patient' ? patientNavItems : otherRoleNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 dark:bg-gray-900/80 flex justify-around z-50">
      {navItems.map((item) => (
        <button
          key={item.label}
          className={`flex flex-col items-center justify-center py-3 px-4 ${
            item.active ? 'text-[#9b87f5]' : 'text-gray-500'
          } ${item.disabled ? 'opacity-50' : 'hover:text-[#7E69AB]'}`}
          onClick={item.action}
          aria-label={item.label}
          disabled={item.disabled}
        >
          <item.icon className="h-5 w-5 mb-1" />
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
