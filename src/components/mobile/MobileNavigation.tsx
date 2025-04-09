
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, User, Settings, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WhatsAppStyleChatInterface } from '@/components/chat/WhatsAppStyleChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleAppointment } from '@/components/appointments/ScheduleAppointment';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [patientRoomId, setPatientRoomId] = useState<string | null>(null);
  
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
    
    // For patients, open the chat dialog with their care team room
    // For other users, navigate to the chat page
    if (userRole === 'patient' && patientRoomId) {
      setChatOpen(true);
    } else {
      navigate('/chat');
    }
  };
  
  const handleCalendarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Open the schedule appointment dialog
    setScheduleOpen(true);
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
      action: handleCalendarClick,
      active: scheduleOpen || location.pathname.includes('appointments')
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
      
      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0">
          <div className="h-[80vh]">
            <WhatsAppStyleChatInterface patientRoomId={patientRoomId} />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Schedule Appointment Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0">
          <div className="h-[80vh]">
            <ScheduleAppointment 
              callerRole={userRole || "patient"}
              preSelectedDoctorId=""
              preSelectedPatientId={userRole === "patient" ? user?.id : ""}
            >
              <span></span>
            </ScheduleAppointment>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
