
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { createMockPayment } from "@/utils/mockPayment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, setHours, setMinutes } from "date-fns";

interface Doctor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  consultation_fee: number;
}

interface DoctorAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ScheduleAppointmentProps {
  children: React.ReactNode;
}

interface PaymentStep {
  status: "idle" | "processing" | "success" | "error";
  error?: string;
}

export const ScheduleAppointment = ({ children }: ScheduleAppointmentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedDoctor, setSelectedDoctor] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"selection" | "confirmation" | "payment">("selection");
  const [paymentStep, setPaymentStep] = useState<PaymentStep>({ status: "idle" });

  const { data: doctors, isLoading: isDoctorsLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      console.log("Starting doctor fetch...");
      
      // First, get profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("first_name");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Then, filter to only doctor roles
      const { data: doctorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "doctor");

      if (rolesError) {
        console.error("Error fetching doctor roles:", rolesError);
        throw rolesError;
      }

      // Match profiles with doctor roles
      const doctorIds = doctorRoles.map(role => role.user_id);
      const doctorProfiles = profiles.filter(profile => 
        doctorIds.includes(profile.id)
      );

      console.log("Doctor profiles fetched:", doctorProfiles);
      return doctorProfiles as Doctor[];
    },
  });

  const { data: doctorAvailability } = useQuery({
    queryKey: ["doctor_availability", selectedDoctor],
    queryFn: async () => {
      if (!selectedDoctor) return null;
      
      const { data, error } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", selectedDoctor)
        .eq("is_available", true);

      if (error) throw error;
      return data as DoctorAvailability[];
    },
    enabled: !!selectedDoctor,
  });

  const selectedDoctorData = doctors?.find(d => d.id === selectedDoctor);

  const getAvailableTimeSlots = () => {
    if (!selectedDate || !doctorAvailability) return [];

    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = doctorAvailability.find(a => a.day_of_week === dayOfWeek);
    
    if (!dayAvailability) return [];

    const slots = [];
    const [startHour, startMinute] = dayAvailability.start_time.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.end_time.split(':').map(Number);
    
    let current = setHours(setMinutes(selectedDate, startMinute), startHour);
    const end = setHours(setMinutes(selectedDate, endMinute), endHour);

    while (current < end) {
      slots.push(format(current, 'HH:mm'));
      current = new Date(current.getTime() + 30 * 60000); // Add 30 minutes
    }

    return slots;
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedDoctor || !user || !selectedDoctorData) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setStep("confirmation");
    } catch (error: any) {
      toast({
        title: "Error scheduling appointment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConfirmAppointment = async () => {
    if (!selectedDate || !selectedTime || !selectedDoctor || !user || !selectedDoctorData) return;

    setStep("payment");
    setPaymentStep({ status: "processing" });

    try {
      const payment = await createMockPayment(selectedDoctorData.consultation_fee);

      if (payment.status === "completed") {
        const scheduledAt = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(":");
        scheduledAt.setHours(parseInt(hours), parseInt(minutes));

        const { error: appointmentError } = await supabase
          .from("appointments")
          .insert({
            patient_id: user.id,
            doctor_id: selectedDoctor,
            scheduled_at: scheduledAt.toISOString(),
            status: "scheduled",
            payment_confirmed: true,
          });

        if (appointmentError) throw appointmentError;

        setPaymentStep({ status: "success" });
        toast({
          title: "Appointment scheduled successfully",
          description: "Your appointment has been confirmed and payment processed.",
        });

        setTimeout(() => {
          setIsOpen(false);
          setStep("selection");
          setSelectedDate(undefined);
          setSelectedTime(undefined);
          setSelectedDoctor(undefined);
          setPaymentStep({ status: "idle" });
        }, 2000);
      }
    } catch (error: any) {
      setPaymentStep({ status: "error", error: error.message });
      toast({
        title: "Error processing payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (step) {
      case "selection":
        return (
          <div className="grid gap-3 py-3">
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {isDoctorsLoading ? (
                  <SelectItem value="loading" disabled>Loading doctors...</SelectItem>
                ) : !doctors?.length ? (
                  <SelectItem value="none" disabled>No doctors available</SelectItem>
                ) : (
                  doctors?.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name} - ₹{doctor.consultation_fee}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => 
                date < new Date() || 
                date.getDay() === 0 || 
                date.getDay() === 6
              }
              className="rounded-md border p-2"
            />

            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{selectedTime || "Select time"}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {getAvailableTimeSlots().map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSchedule} disabled={!selectedDate || !selectedTime || !selectedDoctor}>
              Continue to Confirmation
            </Button>
          </div>
        );

      case "confirmation":
        return (
          <div className="space-y-4 py-3">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-medium">Appointment Details</p>
              <p>Doctor: Dr. {selectedDoctorData?.first_name} {selectedDoctorData?.last_name}</p>
              <p>Date: {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}</p>
              <p>Time: {selectedTime}</p>
              <p className="font-medium mt-2">Consultation Fee: ₹{selectedDoctorData?.consultation_fee}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("selection")}>
                Back
              </Button>
              <Button onClick={handleConfirmAppointment}>
                Proceed to Payment
              </Button>
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4 py-3">
            {paymentStep.status === "processing" && (
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p>Processing payment...</p>
              </div>
            )}

            {paymentStep.status === "success" && (
              <div className="text-center space-y-3 text-green-600">
                <p className="text-lg font-medium">Payment Successful!</p>
                <p>Your appointment has been confirmed.</p>
              </div>
            )}

            {paymentStep.status === "error" && (
              <div className="text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                <p className="text-destructive">{paymentStep.error}</p>
                <Button variant="outline" onClick={() => setStep("confirmation")}>
                  Try Again
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {step === "selection" && "Schedule Appointment"}
            {step === "confirmation" && "Confirm Appointment"}
            {step === "payment" && "Payment"}
          </DialogTitle>
          <DialogDescription>
            {step === "selection" && "Choose your preferred doctor and appointment time"}
            {step === "confirmation" && "Review your appointment details"}
            {step === "payment" && "Complete your payment to confirm the appointment"}
          </DialogDescription>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};
