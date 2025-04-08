
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, User, Settings, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WhatsAppStyleChatInterface } from '@/components/chat/WhatsAppStyleChatInterface';
import { supabase } from '@/integrations/supabase/client';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [patientRoomId, setPatientRoomId] = useState<string | null>(null);
  
  // Use useEffect hook regardless of user being logged in or not
  useEffect(() => {
    // Only fetch patient room ID if user is logged in and is a patient
    if (user && userRole === 'patient') {
      const fetchPatientChatRoom = async () => {
        try {
          // Use the RPC function for better security
          const { data: roomId, error: roomError } = await supabase
            .rpc('get_patient_care_team_room', { p_patient_id: user.id });
          
          if (roomError) {
            console.error("Error fetching patient care team room:", roomError);
          } else if (roomId) {
            console.log("Found patient care team room in mobile nav:", roomId);
            setPatientRoomId(roomId);
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
    
    // For patients, open the chat dialog with their care team room
    // For other users, navigate to the chat page
    if (userRole === 'patient' && patientRoomId) {
      setChatOpen(true);
    } else {
      navigate('/chat');
    }
  };
  
  const navItems = [
    {
      label: 'Home',
      icon: Home,
      action: () => navigate('/dashboard'),
      active: location.pathname === '/dashboard'
    },
    {
      label: 'Calendar',
      icon: Calendar,
      action: () => navigate('/dashboard'),
      active: location.pathname.includes('appointments')
    },
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

  return (
    <>
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`mobile-nav-item ${item.active ? 'active' : ''}`}
            onClick={item.action}
          >
            <item.icon className="mobile-nav-icon h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0">
          <div className="h-[80vh]">
            <WhatsAppStyleChatInterface patientRoomId={patientRoomId} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
