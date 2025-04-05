
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parse, isEqual } from "date-fns";
import { extractDate, extractTime } from "@/utils/VoiceAgent";

interface SchedulingState {
  selectedPatient: string | null;
  selectedDate: Date | null;
  selectedTime: string | null;
}

export const useVoiceScheduling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [schedulingStep, setSchedulingStep] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Use a ref to keep track of the current state for async callbacks
  const stateRef = useRef<SchedulingState>({
    selectedPatient: null,
    selectedDate: null,
    selectedTime: null
  });
  
  useEffect(() => {
    stateRef.current = {
      selectedPatient: selectedPatient,
      selectedDate: selectedDate,
      selectedTime: selectedTime
    };
    
    console.log("State updated - Patient:", selectedPatient, 
      "Date:", selectedDate ? selectedDate.toISOString() : null, 
      "Time:", selectedTime);
  }, [selectedPatient, selectedDate, selectedTime]);

  // Use RPC function to get patients assigned to this doctor
  const { data: patients = [] } = useQuery({
    queryKey: ["doctor-patients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.rpc("get_doctor_patients", {
        p_doctor_id: user.id
      });

      if (error) {
        console.error("Error fetching patients:", error);
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user?.id,
  });

  // Get all existing appointments for this doctor
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
  
  const isTimeSlotBooked = (date: Date, time: string): boolean => {
    if (!date || !time || !existingAppointments.length) return false;
    
    const timeComponents = time.split(":");
    const appointmentDateTime = new Date(date);
    appointmentDateTime.setHours(parseInt(timeComponents[0], 10));
    appointmentDateTime.setMinutes(parseInt(timeComponents[1], 10));
    
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

  // Schedule an appointment using the create_appointment RPC function
  const scheduleAppointment = async (
    patientId: string,
    appointmentDate: Date,
    appointmentTime: string
  ) => {
    try {
      if (isScheduling) return;
      setIsScheduling(true);
      
      console.log("Starting appointment scheduling with:", {
        patient: patientId,
        date: appointmentDate ? appointmentDate.toISOString() : null,
        time: appointmentTime
      });
      
      if (!patientId || !appointmentDate || !appointmentTime) {
        console.error("Missing required information for scheduling");
        setIsScheduling(false);
        return null;
      }

      const selectedPatientInfo = patients.find(p => p.id === patientId);
      if (!selectedPatientInfo) {
        console.error("Patient information not found");
        setIsScheduling(false);
        return null;
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
        if (error.message.includes("Time slot is already booked")) {
          setSchedulingStep("SELECT_TIME");
          setIsScheduling(false);
          return { error: "time_slot_booked" };
        }
        setIsScheduling(false);
        throw error;
      }

      console.log("Appointment created successfully:", data);

      const confirmationText = `Appointment scheduled for ${selectedPatientInfo.first_name} ${selectedPatientInfo.last_name} on ${format(scheduledDate, "EEEE, MMMM do, yyyy")} at ${format(parse(appointmentTime, "HH:mm", new Date()), "h:mm a")}`;
      setAppointmentDetails(confirmationText);
      setShowConfirmation(true);
      
      toast({
        title: "Appointment Scheduled Successfully",
        description: confirmationText,
      });
      
      // Invalidate queries to refresh data across components
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments-all"] });
      queryClient.invalidateQueries({ queryKey: ["today-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["doctor_dashboard_stats"] });
      
      setIsScheduling(false);
      return { success: true, confirmationText };
      
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      toast({
        title: "Error Scheduling Appointment",
        description: error.message,
        variant: "destructive",
      });
      setIsScheduling(false);
      return { error: error.message };
    }
  };

  const resetScheduling = () => {
    setSchedulingStep(null);
    setSelectedPatient(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setShowConfirmation(false);
    setAppointmentDetails("");
    setIsScheduling(false);
  };

  return {
    schedulingStep,
    setSchedulingStep,
    selectedPatient,
    setSelectedPatient,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    showConfirmation,
    setShowConfirmation,
    appointmentDetails,
    setAppointmentDetails,
    isScheduling,
    stateRef,
    patients,
    existingAppointments,
    isTimeSlotBooked,
    scheduleAppointment,
    resetScheduling
  };
};
