
import { Button } from "@/components/ui/button";
import { Calendar, Users, Mic } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { VoiceScheduler } from "@/components/voice/VoiceScheduler";
import { useAuth } from "@/contexts/AuthContext";

export const DoctorActions = () => {
  const { userRole, resetInactivityTimer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showVoiceScheduler, setShowVoiceScheduler] = useState(false);
  
  const isPatientsPage = location.pathname === '/patients';

  if (userRole !== 'doctor') return null;
  
  return (
    <>
      {!isPatientsPage && (
        <Button 
          className="text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
          size="sm"
          variant="ghost"
          onClick={() => {
            resetInactivityTimer();
            navigate("/patients");
          }}
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Patients</span>
        </Button>
      )}
      
      <ScheduleAppointment callerRole="doctor">
        <Button 
          className="text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
          size="sm"
          variant="ghost"
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Schedule</span>
        </Button>
      </ScheduleAppointment>

      <Button 
        className="text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
        size="sm"
        variant="ghost"
        onClick={() => setShowVoiceScheduler(true)}
      >
        <Mic className="h-4 w-4" />
        <span className="hidden sm:inline">Voice</span>
      </Button>

      {showVoiceScheduler && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="w-full max-w-md">
            <VoiceScheduler onClose={() => setShowVoiceScheduler(false)} />
          </div>
        </div>
      )}
    </>
  );
};
