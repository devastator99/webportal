
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { createMockPayment } from "@/utils/mockPayment";
import { useToast } from "@/hooks/use-toast";
import { PaymentStatus } from "./PaymentStatus";
import { Loader2 } from "lucide-react";

interface ScheduleAppointmentProps {
  children?: React.ReactNode;
  standalone?: boolean;
  callerRole?: "patient" | "doctor" | "reception";
}

type Step = "selection" | "payment";

export const ScheduleAppointment = ({ 
  children, 
  standalone = false, 
  callerRole 
}: ScheduleAppointmentProps) => {
  const [isOpen, setIsOpen] = useState(standalone);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("selection");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<{
    status: "idle" | "processing" | "success" | "error";
    error?: string;
  }>({ status: "idle" });

  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-determine callerRole if not provided
  const effectiveCallerRole = callerRole || userRole as "patient" | "doctor" | "reception" || "patient";

  // Set patient ID automatically if user is a patient
  useEffect(() => {
    if (effectiveCallerRole === "patient" && user?.id) {
      setSelectedPatient(user.id);
    }
  }, [effectiveCallerRole, user?.id]);

  // Set doctor ID automatically if user is a doctor
  useEffect(() => {
    if (effectiveCallerRole === "doctor" && user?.id) {
      setSelectedDoctor(user.id);
    }
  }, [effectiveCallerRole, user?.id]);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  ];

  // Query for doctors list (used by patient and reception)
  const { data: doctors, error: doctorsError } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      try {
        const { data: doctorIds, error: rpcError } = await supabase
          .rpc('get_users_by_role', {
            role_name: 'doctor'
          });

        if (rpcError) throw rpcError;

        if (!doctorIds || doctorIds.length === 0) {
          return [];
        }

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', doctorIds.map(d => d.user_id));

        if (profilesError) throw profilesError;

        return profiles || [];
      } catch (error) {
        console.error("Error in doctors query:", error);
        throw error;
      }
    },
    enabled: !!user?.id && (effectiveCallerRole === "patient" || effectiveCallerRole === "reception"),
  });

  // Query for patients list (used by doctor and reception)
  const { data: patients, error: patientsError } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      try {
        const { data: patientIds, error: rpcError } = await supabase
          .rpc('get_users_by_role', {
            role_name: 'patient'
          });

        if (rpcError) throw rpcError;

        if (!patientIds || patientIds.length === 0) {
          return [];
        }

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', patientIds.map(p => p.user_id));

        if (profilesError) throw profilesError;

        return profiles || [];
      } catch (error) {
        console.error("Error in patients query:", error);
        throw error;
      }
    },
    enabled: !!user?.id && (effectiveCallerRole === "doctor" || effectiveCallerRole === "reception"),
  });

  // Log any query errors
  if (doctorsError) {
    console.error("Doctors query error:", doctorsError);
  }
  if (patientsError) {
    console.error("Patients query error:", patientsError);
  }

  const handleConfirmAppointment = async () => {
    if (isSubmitting) return; // Prevent double submission

    // Validation based on caller role
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to schedule an appointment",
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select date and time",
      });
      return;
    }

    // Validate doctor/patient selection based on role
    if (effectiveCallerRole === "patient" && !selectedDoctor) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a doctor",
      });
      return;
    }

    if (effectiveCallerRole === "doctor" && !selectedPatient) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a patient",
      });
      return;
    }

    if (effectiveCallerRole === "reception" && (!selectedDoctor || !selectedPatient)) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select both doctor and patient",
      });
      return;
    }

    // Get the doctor object for payment calculation
    const effectiveDoctor = selectedDoctor 
      ? doctors?.find((d) => d.id === selectedDoctor) 
      : null;

    if (!effectiveDoctor && (effectiveCallerRole === "patient" || effectiveCallerRole === "reception")) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selected doctor not found",
      });
      return;
    }

    setIsSubmitting(true);
    setStep("payment");
    setPaymentStep({ status: "processing" });

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(hours, minutes);

      const patientId = effectiveCallerRole === "patient" ? user.id : selectedPatient;
      const doctorId = effectiveCallerRole === "doctor" ? user.id : selectedDoctor;

      const { data: appointment, error: appointmentError } = await supabase
        .rpc('create_appointment', {
          p_patient_id: patientId,
          p_doctor_id: doctorId,
          p_scheduled_at: appointmentDateTime.toISOString(),
          p_status: 'scheduled'
        });

      if (appointmentError) {
        if (appointmentError.message.includes('Time slot is already booked')) {
          throw new Error("This time slot is already booked. Please select another time.");
        }
        throw appointmentError;
      }

      // Process payment - only for patient role, otherwise auto-confirm
      if (effectiveCallerRole === "patient") {
        const paymentResult = await createMockPayment(effectiveDoctor.consultation_fee || 100);
        if (paymentResult.status !== "completed") {
          throw new Error("Payment failed");
        }
      }

      setPaymentStep({ status: "success" });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["patient_dashboard"] });
      if (effectiveCallerRole === "doctor") {
        queryClient.invalidateQueries({ queryKey: ["doctor_appointments"] });
      }
      
      toast({
        title: "Appointment scheduled successfully",
        description: "The appointment has been confirmed",
      });
      
      setTimeout(() => {
        setIsOpen(false);
        setStep("selection");
        setPaymentStep({ status: "idle" });
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedDoctor(null);
        setSelectedPatient(null);
        setIsSubmitting(false);
      }, 2000);
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      setPaymentStep({
        status: "error",
        error: error.message || "Failed to schedule appointment. Please try again.",
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to schedule appointment. Please try again.",
      });
      setTimeout(() => {
        setStep("selection");
        setPaymentStep({ status: "idle" });
        setIsSubmitting(false);
      }, 2000);
    }
  };

  // Generate the appointment form based on role
  const renderAppointmentForm = () => {
    return (
      <div className="grid gap-3 py-3">
        {/* Doctor selection - show for patient and reception roles */}
        {(effectiveCallerRole === "patient" || effectiveCallerRole === "reception") && (
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="doctor" className="font-medium text-sm">Select Doctor</label>
            <select
              id="doctor"
              className="w-full px-3 py-1.5 rounded-md border text-sm"
              onChange={(e) => setSelectedDoctor(e.target.value)}
              value={selectedDoctor || ""}
              disabled={effectiveCallerRole === "doctor"}
            >
              <option value="">Select a doctor</option>
              {doctors?.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Patient selection - show for doctor and reception roles */}
        {(effectiveCallerRole === "doctor" || effectiveCallerRole === "reception") && (
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="patient" className="font-medium text-sm">Select Patient</label>
            <select
              id="patient"
              className="w-full px-3 py-1.5 rounded-md border text-sm"
              onChange={(e) => setSelectedPatient(e.target.value)}
              value={selectedPatient || ""}
              disabled={effectiveCallerRole === "patient"}
            >
              <option value="">Select a patient</option>
              {patients?.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date selection - common for all roles */}
        <div className="grid grid-cols-1 gap-2">
          <label htmlFor="date" className="font-medium text-sm">Select Date</label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border mx-auto scale-90 transform origin-top"
            disabled={(date) => date < new Date()}
          />
        </div>

        {/* Time selection - common for all roles */}
        <div className="grid grid-cols-1 gap-2">
          <label htmlFor="time" className="font-medium text-sm">Select Time</label>
          <select
            id="time"
            className="w-full px-3 py-1.5 rounded-md border text-sm"
            onChange={(e) => setSelectedTime(e.target.value)}
            value={selectedTime || ""}
          >
            <option value="">Select a time</option>
            {timeSlots.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* Confirm button - common for all roles */}
        <div className="mt-3">
          <Button 
            onClick={handleConfirmAppointment} 
            className="w-full"
            size="sm"
            disabled={
              (effectiveCallerRole === "patient" && (!selectedDoctor || !selectedDate || !selectedTime)) ||
              (effectiveCallerRole === "doctor" && (!selectedPatient || !selectedDate || !selectedTime)) ||
              (effectiveCallerRole === "reception" && (!selectedDoctor || !selectedPatient || !selectedDate || !selectedTime)) ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Appointment'
            )}
          </Button>
        </div>
      </div>
    );
  };

  // For standalone mode (route-based), render the appointment form directly
  if (standalone) {
    return (
      <div className="container mx-auto max-w-md p-4 mt-20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">Schedule Appointment</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {effectiveCallerRole === "patient" ? "Choose your preferred doctor, date, and time." :
             effectiveCallerRole === "doctor" ? "Schedule an appointment with a patient." :
             "Schedule an appointment for a doctor and patient."}
          </p>
          
          {step === "selection" ? renderAppointmentForm() : <PaymentStatus paymentStep={paymentStep} />}
        </div>
      </div>
    );
  }

  // For dialog mode (embedded in other components)
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[95%] max-w-md overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            {effectiveCallerRole === "patient" ? "Choose your preferred doctor, date, and time." :
             effectiveCallerRole === "doctor" ? "Schedule an appointment with a patient." :
             "Schedule an appointment for a doctor and patient."}
          </DialogDescription>
        </DialogHeader>
        {step === "selection" ? renderAppointmentForm() : <PaymentStatus paymentStep={paymentStep} />}
      </DialogContent>
    </Dialog>
  );
};
