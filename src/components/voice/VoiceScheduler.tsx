
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  VoiceAgent,
  schedulingCommands,
  extractDate,
  extractTime,
} from "@/utils/VoiceAgent";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { useAuth } from "@/contexts/AuthContext";
import { Mic, MicOff, Calendar, User, Clock } from "lucide-react";

interface VoiceSchedulerProps {
  onClose: () => void;
}

export const VoiceScheduler: React.FC<VoiceSchedulerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Click the microphone to start voice scheduling");
  const [schedulingStep, setSchedulingStep] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [openScheduler, setOpenScheduler] = useState(false);
  const voiceAgentRef = useRef<VoiceAgent | null>(null);
  const schedulerDialogRef = useRef<HTMLButtonElement | null>(null);
  
  // Fetch patients using the get_patients RPC function
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_patients");

      if (error) {
        console.error("Error fetching patients:", error);
        throw new Error(error.message);
      }

      return data;
    },
  });

  // Initialize voice agent
  useEffect(() => {
    voiceAgentRef.current = new VoiceAgent(handleCommand, setVoiceStatus);
    
    return () => {
      if (voiceAgentRef.current) {
        voiceAgentRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (listening) {
      voiceAgentRef.current?.stop();
      setListening(false);
    } else {
      voiceAgentRef.current?.start();
      setListening(true);
    }
  };

  const handleCommand = (command: string, params: string) => {
    console.log(`Command detected: ${command}, params: ${params}`);
    
    switch (command) {
      case "START_SCHEDULING":
        setSchedulingStep("SELECT_PATIENT");
        speak("Which patient would you like to schedule for?");
        break;
        
      case "SELECT_PATIENT":
        // Find patient based on spoken name
        const patientName = params.trim().toLowerCase();
        const foundPatient = patients.find(
          (p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientName)
        );
        
        if (foundPatient) {
          setSelectedPatient(foundPatient.id);
          setSchedulingStep("SELECT_DATE");
          speak(`Patient ${foundPatient.first_name} ${foundPatient.last_name} selected. What date would you like to schedule?`);
        } else {
          speak("Patient not found. Please try again or say the full name.");
        }
        break;
        
      case "SELECT_DATE":
        const date = extractDate(params);
        if (date) {
          setSelectedDate(date);
          setSchedulingStep("SELECT_TIME");
          speak(`Date set to ${format(date, "MMMM do")}. What time would you like to schedule?`);
        } else {
          speak("I couldn't understand the date. Please say a date like tomorrow or next Monday.");
        }
        break;
        
      case "SELECT_TIME":
        const time = extractTime(params);
        if (time) {
          setSelectedTime(time);
          setSchedulingStep("CONFIRM");
          speak("Ready to schedule. Please say confirm to book the appointment.");
        } else {
          speak("I couldn't understand the time. Please say a time like 2 PM or 14:30.");
        }
        break;
        
      case "CONFIRM":
        if (selectedPatient && selectedDate && selectedTime) {
          // Trigger the appointment scheduler
          setOpenScheduler(true);
          speak("Opening the appointment scheduler with your selections.");
          
          // Give time for the dialog to open, then stop listening
          setTimeout(() => {
            voiceAgentRef.current?.stop();
            setListening(false);
            
            // Click the dialog element if it's available
            if (schedulerDialogRef.current) {
              schedulerDialogRef.current.click();
            }
          }, 1000);
        } else {
          speak("Missing some information. Please provide patient, date, and time.");
        }
        break;
        
      case "CANCEL":
        resetScheduling();
        speak("Appointment scheduling cancelled.");
        break;
        
      default:
        speak("I didn't understand that command. Please try again.");
    }
  };

  const resetScheduling = () => {
    setSchedulingStep(null);
    setSelectedPatient(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setOpenScheduler(false);
  };

  // Simple text-to-speech implementation
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-[#9b87f5] text-white">
        <CardTitle className="flex items-center justify-between">
          <span>Voice Appointment Scheduler</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="hover:bg-[#8a75e7] text-white"
          >
            Close
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex justify-center">
            <Button
              size="lg"
              className={`rounded-full p-6 ${
                listening ? "bg-red-500 hover:bg-red-600" : "bg-[#9b87f5] hover:bg-[#8a75e7]"
              }`}
              onClick={toggleListening}
            >
              {listening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
          </div>
          
          <div className="text-center text-muted-foreground">
            {voiceStatus}
          </div>
          
          <div className="border rounded-md p-4 space-y-4">
            <h3 className="font-medium text-center">Current Selections</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#9b87f5]" />
                <span className="font-medium">Patient:</span>
                <span>{selectedPatient 
                  ? patients.find(p => p.id === selectedPatient)?.first_name + ' ' + 
                    patients.find(p => p.id === selectedPatient)?.last_name 
                  : "Not selected"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#9b87f5]" />
                <span className="font-medium">Date:</span>
                <span>{selectedDate ? format(selectedDate, "PPP") : "Not selected"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#9b87f5]" />
                <span className="font-medium">Time:</span>
                <span>{selectedTime 
                  ? format(parse(selectedTime, "HH:mm", new Date()), "h:mm a") 
                  : "Not selected"}</span>
              </div>
            </div>
          </div>
          
          <div className="text-sm border-t pt-2 space-y-1">
            <h4 className="font-medium">Voice Commands:</h4>
            <p>"Schedule appointment" - Start scheduling</p>
            <p>"Select patient [name]" - Choose a patient</p>
            <p>"Select date [date]" - Choose a date</p>
            <p>"Select time [time]" - Choose a time</p>
            <p>"Confirm" - Book the appointment</p>
            <p>"Cancel" - Cancel scheduling</p>
          </div>
          
          <div className="hidden">
            <ScheduleAppointment
              callerRole="doctor"
              preSelectedPatientId={selectedPatient || undefined}
              preSelectedDate={selectedDate || undefined}
              preSelectedTime={selectedTime || undefined}
            >
              <button ref={schedulerDialogRef}>Open Scheduler</button>
            </ScheduleAppointment>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
