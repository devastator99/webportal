
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
          const { data, error } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('patient_id', user.id)
            .eq('room_type', 'care_team')
            .eq('is_active', true)
            .limit(1)
            .single();
          
          if (error) {
            console.error("Error fetching patient care team room:", error);
          } else if (data) {
            setPatientRoomId(data.id);
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
