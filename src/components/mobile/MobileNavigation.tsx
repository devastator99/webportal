import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Settings, Activity, FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WhatsAppStyleChatInterface } from '@/components/chat/WhatsAppStyleChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [patientRoomId, setPatientRoomId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  useEffect(() => {
    if (user && userRole === 'patient') {
      const fetchPatientChatRoom = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-patient-care-team-room', {
            body: { patient_id: user.id }
          });
          
          if (error) {
            console.error("Error fetching patient care team room:", error);
          } else if (data) {
            console.log("Found patient care team room in mobile nav:", data);
            setPatientRoomId(String(data.room_id));
          } else {
            console.log("No care team room found for patient in mobile nav");
          }
        } catch (error) {
          console.error("Error in patient room fetch:", error);
        }
      };
      
      fetchPatientChatRoom();
    }
  }, [user, userRole]);
  
  if (!user) {
    return null;
  }
  
  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (userRole === 'patient' && patientRoomId) {
      setChatOpen(true);
    } else {
      navigate('/chat');
    }
  };

  const handlePrescriptionsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/prescriptions');
  };
  
  const handleHabitsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/habits');
  };
  
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
  
  const patientNavItems = [
    {
      label: 'Prescription',
      icon: FileText,
      action: handlePrescriptionsClick,
      active: location.pathname === '/prescriptions'
    },
    {
      label: 'Habits',
      icon: Activity,
      action: handleHabitsClick,
      active: location.pathname === '/habits'
    },
    {
      label: 'Profile',
      icon: Settings,
      action: () => navigate('/dashboard-alt'),
      active: location.pathname === '/dashboard-alt'
    },
    {
      label: isSigningOut ? 'Signing Out...' : 'Sign Out',
      icon: LogOut,
      action: handleSignOut,
      active: false
    }
  ];
  
  const otherRoleNavItems = [
    {
      label: 'Chat',
      icon: MessageCircle,
      action: handleChatClick,
      active: chatOpen || location.pathname === '/chat'
    },
    {
      label: 'Profile',
      icon: Settings,
      action: () => navigate('/dashboard-alt'),
      active: location.pathname === '/dashboard-alt'
    },
    {
      label: isSigningOut ? 'Signing Out...' : 'Sign Out',
      icon: LogOut,
      action: handleSignOut,
      active: false
    }
  ];
  
  let navItems = userRole === 'patient' ? patientNavItems : otherRoleNavItems;

  return (
    <>
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`mobile-nav-item ${item.active ? 'active' : ''}`}
            onClick={item.action}
            aria-label={item.label}
            disabled={item.label === 'Signing Out...'}
          >
            <item.icon 
              className="mobile-nav-icon h-5 w-5" 
            />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat</DialogTitle>
            <DialogDescription>Chat with your care team</DialogDescription>
          </DialogHeader>
          <div className="h-[80vh]">
            <WhatsAppStyleChatInterface patientRoomId={patientRoomId} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
