
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { createMockPayment } from "@/utils/mockPayment";
import { useToast } from "@/hooks/use-toast";
import { PaymentStatus } from "./PaymentStatus";

interface ScheduleAppointmentProps {
  children: React.ReactNode;
}

type Step = "selection" | "payment";

export const ScheduleAppointment = ({ children }: ScheduleAppointmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("selection");
  const [paymentStep, setPaymentStep] = useState<{
    status: "idle" | "processing" | "success" | "error";
    error?: string;
  }>({ status: "idle" });

  const { user } = useAuth();
  const { toast } = useToast();

  console.log("Current user ID:", user?.id);

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
  ];

  const { data: doctors, error: doctorsError } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      console.log("Fetching doctors...");
      try {
        // Get all profiles that have the doctor role
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .eq('role', 'doctor');

        if (profilesError) {
          console.error("Error fetching doctor profiles:", profilesError);
          throw profilesError;
        }
      
        console.log("Doctors data:", profiles);
        return profiles || [];
      } catch (error) {
        console.error("Error in doctors query:", error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  if (doctorsError) {
    console.error("Query error:", doctorsError);
  }

  const handleConfirmAppointment = async () => {
    if (!user?.id || !selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select all required fields",
      });
      return;
    }

    const selectedDoctor1 = doctors?.find((d) => d.id === selectedDoctor);
    if (!selectedDoctor1) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selected doctor not found",
      });
      return;
    }

    setStep("payment");
    setPaymentStep({ status: "processing" });

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(hours, minutes);

      // Check for existing appointments at the same time
      const { data: existingAppointments, error: checkError } = await supabase
        .from("appointments")
        .select("*")
        .eq('doctor_id', selectedDoctor)
        .eq('scheduled_at', appointmentDateTime.toISOString());

      if (checkError) throw checkError;

      if (existingAppointments && existingAppointments.length > 0) {
        throw new Error("This time slot is already booked. Please select another time.");
      }

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert([
          {
            patient_id: user.id,
            doctor_id: selectedDoctor,
            scheduled_at: appointmentDateTime.toISOString(),
            status: "scheduled",
          },
        ])
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Process payment
      const paymentResult = await createMockPayment(selectedDoctor1.consultation_fee || 100);

      if (paymentResult.status === "completed") {
        setPaymentStep({ status: "success" });
        toast({
          title: "Appointment scheduled successfully",
          description: "Your appointment has been confirmed",
        });
        setTimeout(() => {
          setIsOpen(false);
          setStep("selection");
          setPaymentStep({ status: "idle" });
          setSelectedDate(null);
          setSelectedTime(null);
          setSelectedDoctor(null);
        }, 2000);
      } else {
        throw new Error("Payment failed");
      }
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
      // Reset to selection step after error
      setTimeout(() => {
        setStep("selection");
        setPaymentStep({ status: "idle" });
      }, 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Choose your preferred doctor, date, and time for your appointment.
          </DialogDescription>
        </DialogHeader>
        {step === "selection" ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="doctor" className="font-medium">Select Doctor</label>
              <select
                id="doctor"
                className="w-full px-4 py-2 rounded-md border"
                onChange={(e) => setSelectedDoctor(e.target.value)}
                value={selectedDoctor || ""}
              >
                <option value="">Select a doctor</option>
                {doctors?.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="date" className="font-medium">Select Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border mx-auto"
                disabled={(date) => date < new Date()}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="time" className="font-medium">Select Time</label>
              <select
                id="time"
                className="w-full px-4 py-2 rounded-md border"
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
            <div className="mt-4">
              <Button 
                onClick={handleConfirmAppointment} 
                className="w-full"
                disabled={!selectedDoctor || !selectedDate || !selectedTime}
              >
                Confirm Appointment
              </Button>
            </div>
          </div>
        ) : (
          <PaymentStatus paymentStep={paymentStep} />
        )}
      </DialogContent>
    </Dialog>
  );
};
