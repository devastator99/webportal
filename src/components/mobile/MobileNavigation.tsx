import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Settings, MessageCircle, FileText, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WhatsAppStyleChatInterface } from '@/components/chat/WhatsAppStyleChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [patientRoomId, setPatientRoomId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use useEffect hook regardless of user being logged in or not
  useEffect(() => {
    // Only fetch patient room ID if user is logged in and is a patient
    if (user && userRole === 'patient') {
      const fetchPatientChatRoom = async () => {
        try {
          // Use the edge function instead of direct RPC
          const { data, error } = await supabase.functions.invoke('get-patient-care-team-room', {
            body: { patient_id: user.id }
          });
          
          if (error) {
            console.error("Error fetching patient care team room:", error);
          } else if (data) {
            console.log("Found patient care team room in mobile nav:", data);
            setPatientRoomId(String(data));
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
  
  // If user is not logged in, don't show the navigation
  if (!user && location.pathname !== '/dashboard' && location.pathname !== '/dashboard-alt') {
    return null;
  }
  
  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // For patients, always open the chat dialog with their care team room
    if (userRole === 'patient' && patientRoomId) {
      setChatOpen(true);
    } else {
      navigate('/chat');
    }
  };

  const handlePrescriptionsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Enhanced logging for prescription navigation
    console.log("====== PRESCRIPTION NAVIGATION DEBUG ======");
    console.log("Current user:", user?.id);
    console.log("User role:", userRole);
    console.log("Current location:", location.pathname);
    console.log("Target location: /prescriptions");
    
    try {
      // Update to use the correct route path
      navigate('/prescriptions', { replace: true });
      toast({
        title: "Loading prescriptions",
        description: "Opening your prescription history...",
      });
      
      // Log after navigation attempt
      console.log("Navigation completed to: /prescriptions");
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        title: "Navigation error",
        description: "Could not navigate to prescriptions page. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleHabitsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/habits');
  };
  
  // Base navigation items that are always shown
  const baseNavItems = [
    {
      label: 'Home',
      icon: Home,
      action: () => navigate('/dashboard'),
      active: location.pathname === '/dashboard'
    }
  ];
  
  // Create patient-specific navigation items - make Chat more prominent
  const patientNavItems = [
    ...baseNavItems,
    {
      label: 'Prescription',
      icon: FileText,
      action: handlePrescriptionsClick,
      // Update active state check to match the correct route
      active: location.pathname === '/prescriptions'
    },
    {
      label: 'Chat',
      icon: MessageCircle,
      action: handleChatClick,
      active: chatOpen || location.pathname === '/chat'
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
    }
  ];
  
  // Create items for other roles
  const otherRoleNavItems = [
    ...baseNavItems,
    {
      label: 'Patients',
      icon: User,
      action: () => navigate('/patients'),
      active: location.pathname === '/patients'
    },
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
    }
  ];
  
  // Use the appropriate navigation items based on role
  let navItems = userRole === 'patient' ? patientNavItems : otherRoleNavItems;
  
  console.log("Navigation items:", navItems);
  console.log("Current path:", location.pathname);
  console.log("User role:", userRole);

  return (
    <>
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`mobile-nav-item ${item.active ? 'active' : ''}`}
            onClick={item.action}
            aria-label={item.label}
          >
            <item.icon 
              className="mobile-nav-icon h-5 w-5" 
            />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Chat Dialog */}
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
