import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parse, isEqual } from "date-fns";
import {
  VoiceAgent,
  schedulingCommands,
  extractDate,
  extractTime,
} from "@/utils/VoiceAgent";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { useAuth } from "@/contexts/AuthContext";
import { Mic, MicOff, Calendar, User, Clock, Check, AlertCircle } from "lucide-react";
import { parseTime } from "@/utils/dateUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface VoiceSchedulerProps {
  onClose: () => void;
}

export const VoiceScheduler: React.FC<VoiceSchedulerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Click the microphone to start voice scheduling");
  const [schedulingStep, setSchedulingStep] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [openScheduler, setOpenScheduler] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);
  const voiceAgentRef = useRef<VoiceAgent | null>(null);
  const schedulerDialogRef = useRef<HTMLButtonElement | null>(null);
  
  // Store state values in refs to ensure we always have the latest values
  const stateRef = useRef({
    selectedPatient: null as string | null,
    selectedDate: null as Date | null,
    selectedTime: null as string | null
  });
  
  // Update refs whenever state changes
  useEffect(() => {
    stateRef.current.selectedPatient = selectedPatient;
    stateRef.current.selectedDate = selectedDate;
    stateRef.current.selectedTime = selectedTime;
    
    console.log("State updated - Patient:", selectedPatient, 
      "Date:", selectedDate ? selectedDate.toISOString() : null, 
      "Time:", selectedTime);
  }, [selectedPatient, selectedDate, selectedTime]);
  
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

  // New query to fetch doctor appointments for conflict checking
  const { data: existingAppointments = [] } = useQuery({
    queryKey: ["doctor-appointments-all", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select('scheduled_at')
        .eq('doctor_id', user.id)
        .eq('status', 'scheduled');

      if (error) {
        console.error("Error fetching doctor appointments:", error);
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user?.id,
  });

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

  // Function to check if a time slot is already booked
  const isTimeSlotBooked = (date: Date, time: string): boolean => {
    if (!date || !time || !existingAppointments.length) return false;
    
    // Create a date object with the selected date and time
    const timeComponents = time.split(":");
    const appointmentDateTime = new Date(date);
    appointmentDateTime.setHours(parseInt(timeComponents[0], 10));
    appointmentDateTime.setMinutes(parseInt(timeComponents[1], 10));
    
    // Check if there's any existing appointment at this date and time
    return existingAppointments.some(appointment => {
      const existingDate = new Date(appointment.scheduled_at);
      return (
        existingDate.getFullYear() === appointmentDateTime.getFullYear() &&
        existingDate.getMonth() === appointmentDateTime.getMonth() &&
        existingDate.getDate() === appointmentDateTime.getDate() &&
        existingDate.getHours() === appointmentDateTime.getHours() &&
        existingDate.getMinutes() === appointmentDateTime.getMinutes()
      );
    });
  };

  const handleCommand = (command: string, params: string) => {
    console.log(`Command detected: ${command}, params: ${params}`);
    
    switch (command) {
      case "START_SCHEDULING":
        setSchedulingStep("SELECT_PATIENT");
        speak("Which patient would you like to schedule for?");
        break;
        
      case "SELECT_PATIENT":
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
          speak(`Date set to ${format(date, "MMMM do, yyyy")}. What time would you like to schedule?`);
        } else {
          speak("I couldn't understand the date. Please say a date like tomorrow or next Monday.");
        }
        break;
        
      case "SELECT_TIME":
        const time = extractTime(params);
        if (time) {
          // Check if this time slot is already booked
          if (stateRef.current.selectedDate && isTimeSlotBooked(stateRef.current.selectedDate, time)) {
            speak(`This time slot is already booked. Please select a different time.`);
            // Keep in the same step to allow selecting a different time
            return;
          }
          
          setSelectedTime(time);
          setSchedulingStep("CONFIRM");
          
          // Find the patient name for better feedback
          const patient = patients.find(p => p.id === stateRef.current.selectedPatient);
          const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "the selected patient";
          
          // Get current states for feedback
          const currentDate = stateRef.current.selectedDate;
          
          setTimeout(() => {
            // Use setTimeout to ensure we have the latest state values when speaking
            speak(`Ready to schedule appointment for ${patientName} on ${currentDate ? format(currentDate, "MMMM do, yyyy") : "the selected date"} at ${time}. Please say confirm to book the appointment.`);
          }, 100);
        } else {
          speak("I couldn't understand the time. Please say a time like 2 PM or 14:30.");
        }
        break;
        
      case "CONFIRM":
        // Use the current state from refs to avoid race conditions
        const currentPatient = stateRef.current.selectedPatient;
        const currentDate = stateRef.current.selectedDate;
        const currentTime = stateRef.current.selectedTime;
        
        console.log("Confirmation command received with current state:", {
          patient: currentPatient,
          date: currentDate ? currentDate.toISOString() : null,
          time: currentTime
        });
        
        if (currentPatient && currentDate && currentTime) {
          // Perform another check right before confirming
          if (isTimeSlotBooked(currentDate, currentTime)) {
            speak(`Sorry, this time slot has just been booked by someone else. Please select a different time.`);
            setSchedulingStep("SELECT_TIME");
            return;
          }
          
          console.log("All information present, scheduling appointment");
          scheduleAppointment(currentPatient, currentDate, currentTime);
        } else {
          console.log("Missing information:", {
            patient: currentPatient,
            date: currentDate,
            time: currentTime
          });
          
          const missingItems = [];
          if (!currentPatient) missingItems.push("patient");
          if (!currentDate) missingItems.push("date");
          if (!currentTime) missingItems.push("time");
          
          speak(`Missing information: ${missingItems.join(", ")}. Please provide all required information before confirming.`);
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

  const scheduleAppointment = async (
    patientId: string,
    appointmentDate: Date,
    appointmentTime: string
  ) => {
    try {
      if (isScheduling) return; // Prevent multiple submissions
      setIsScheduling(true);
      
      console.log("Starting appointment scheduling with:", {
        patient: patientId,
        date: appointmentDate ? appointmentDate.toISOString() : null,
        time: appointmentTime
      });
      
      if (!patientId || !appointmentDate || !appointmentTime) {
        console.error("Missing required information for scheduling");
        speak("Missing some information. Cannot schedule appointment.");
        setIsScheduling(false);
        return;
      }

      const selectedPatientInfo = patients.find(p => p.id === patientId);
      if (!selectedPatientInfo) {
        console.error("Patient information not found");
        speak("Patient information not found.");
        setIsScheduling(false);
        return;
      }

      const timeComponents = appointmentTime.split(":");
      const scheduledDate = new Date(appointmentDate);
      scheduledDate.setHours(parseInt(timeComponents[0], 10));
      scheduledDate.setMinutes(parseInt(timeComponents[1], 10));

      const formattedDate = scheduledDate.toISOString();
      
      console.log("Creating appointment with data:", {
        patientId: patientId,
        doctorId: user?.id,
        scheduledAt: formattedDate
      });
      
      const { data, error } = await supabase.rpc("create_appointment", {
        p_patient_id: patientId,
        p_doctor_id: user?.id,
        p_scheduled_at: formattedDate,
        p_status: "scheduled"
      });

      if (error) {
        console.error("Error scheduling appointment:", error);
        // If we get a time slot conflict error from the database
        if (error.message.includes("Time slot is already booked")) {
          speak(`This time slot is already booked. Please select a different time.`);
          setSchedulingStep("SELECT_TIME");
          setIsScheduling(false);
          return;
        }
        speak(`Error scheduling appointment: ${error.message}`);
        setIsScheduling(false);
        throw error;
      }

      console.log("Appointment created successfully:", data);

      // Set confirmation details
      const confirmationText = `Appointment scheduled for ${selectedPatientInfo.first_name} ${selectedPatientInfo.last_name} on ${format(scheduledDate, "EEEE, MMMM do, yyyy")} at ${format(parse(appointmentTime, "HH:mm", new Date()), "h:mm a")}`;
      setAppointmentDetails(confirmationText);
      setShowConfirmation(true);
      
      // Show confirmation toast
      toast({
        title: "Appointment Scheduled Successfully",
        description: confirmationText,
      });

      // Speak confirmation
      speak("Appointment scheduled successfully. " + confirmationText);
      
      // Refresh appointment data
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments-all"] });
      queryClient.invalidateQueries({ queryKey: ["today-schedule"] });
      
      // Reset voice agent
      voiceAgentRef.current?.stop();
      setListening(false);
      
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      speak("There was an error scheduling the appointment. Please try again.");
      toast({
        title: "Error Scheduling Appointment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const resetScheduling = () => {
    setSchedulingStep(null);
    setSelectedPatient(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setOpenScheduler(false);
    setShowConfirmation(false);
    setAppointmentDetails("");
    setIsScheduling(false);
  };

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
        {showConfirmation ? (
          <div className="space-y-6">
            <Alert className="border-green-500 bg-green-50">
              <Check className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800">Appointment Scheduled</AlertTitle>
              <AlertDescription className="text-green-700">
                {appointmentDetails}
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={resetScheduling}
              >
                Schedule Another
              </Button>
              <Button
                onClick={onClose}
                className="bg-[#9b87f5] hover:bg-[#8a75e7] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Button
                size="lg"
                className={`rounded-full p-6 ${
                  listening ? "bg-red-500 hover:bg-red-600" : "bg-[#9b87f5] hover:bg-[#8a75e7]"
                }`}
                onClick={toggleListening}
                disabled={isScheduling}
              >
                {listening ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
            </div>
            
            <div className="text-center text-muted-foreground">
              {isScheduling ? "Scheduling appointment..." : voiceStatus}
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
                  <span>{selectedDate ? format(selectedDate, "EEEE, MMMM do, yyyy") : "Not selected"}</span>
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
              <p>"Select date [date]" - Choose a date (today, tomorrow, January 15, next Monday)</p>
              <p>"Select time [time]" - Choose a time (2 PM, 14:30)</p>
              <p>"Confirm" - Book the appointment</p>
              <p>"Cancel" - Cancel scheduling</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
