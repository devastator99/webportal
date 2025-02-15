
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { createMockPayment } from "@/utils/mockPayment";
import { useToast } from "@/hooks/use-toast";
import { PaymentStatus } from "./PaymentStatus";

interface ScheduleAppointmentProps {
  children: React.ReactNode;
}

// Define step type separately
type Step = "selection" | "payment";

// Import PaymentStepState type from PaymentStatus component to avoid duplication
type PaymentStepState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success" }
  | { status: "error"; error: string };

export const ScheduleAppointment = ({ children }: ScheduleAppointmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [step, setStep] = useState<Step>("selection");
  const [paymentStep, setPaymentStep] = useState<PaymentStepState>({ status: "idle" });

  const { user } = useAuth();
  const { toast } = useToast();

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "doctor");

      if (error) throw error;
      return data;
    },
  });

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
      const paymentResult = await createMockPayment(selectedDoctor1.consultation_fee);

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
          setSelectedDate(undefined);
          setSelectedTime(undefined);
          setSelectedDoctor(undefined);
        }, 2000);
      } else {
        throw new Error("Payment failed");
      }
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      setPaymentStep({
        status: "error",
        error: "Failed to schedule appointment. Please try again.",
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
        </DialogHeader>
        {step === "selection" ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="doctor">Select Doctor</label>
              <select
                id="doctor"
                className="px-4 py-2 rounded-md border"
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
                <option value="">Select a doctor</option>
                {doctors?.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="date">Select Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="time">Select Time</label>
              <select
                id="time"
                className="px-4 py-2 rounded-md border"
                onChange={(e) => setSelectedTime(e.target.value)}
              >
                <option value="">Select a time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleConfirmAppointment}>Confirm Appointment</Button>
          </div>
        ) : (
          <PaymentStatus paymentStep={paymentStep} />
        )}
      </DialogContent>
    </Dialog>
  );
};
