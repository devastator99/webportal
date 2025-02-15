
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
      
      const { data: doctorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "doctor");

      if (rolesError) {
        console.error("Error fetching doctor roles:", rolesError);
        throw rolesError;
      }

      const doctorIds = doctorRoles.map(role => role.user_id);
      
      const { data: doctorProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, consultation_fee")
        .in("id", doctorIds)
        .order("first_name");

      if (profilesError) {
        console.error("Error fetching doctor profiles:", profilesError);
        throw profilesError;
      }

      console.log("Doctor profiles fetched:", doctorProfiles);
      return doctorProfiles as Doctor[];
    },
  });

  const { data: doctorAvailability, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ["doctor_availability", selectedDoctor],
    enabled: !!selectedDoctor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", selectedDoctor);

      if (error) throw error;
      return data as DoctorAvailability[];
    },
  });

  const getAvailableTimeSlots = () => {
    if (!selectedDate || !doctorAvailability) return [];

    const dayOfWeek = selectedDate.getDay();
    const todayAvailability = doctorAvailability.find(
      (a) => a.day_of_week === dayOfWeek && a.is_available
    );

    if (!todayAvailability) return [];

    const slots: string[] = [];
    const { start_time, end_time } = todayAvailability;
    
    const [startHour, startMinute] = start_time.split(":").map(Number);
    const [endHour, endMinute] = end_time.split(":").map(Number);

    let current = setHours(setMinutes(selectedDate, startMinute), startHour);
    const end = setHours(setMinutes(selectedDate, endMinute), endHour);

    while (current < end) {
      slots.push(format(current, "HH:mm"));
      current = new Date(current.getTime() + 30 * 60000); // Add 30 minutes
    }

    return slots;
  };

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

      // Mock payment processing
      const paymentResult = await createMockPayment({
        amount: selectedDoctor1.consultation_fee,
        appointmentId: appointment.id,
      });

      if (paymentResult.status === "success") {
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

  const availableTimeSlots = getAvailableTimeSlots();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Select your preferred doctor, date, and time for the appointment.
          </DialogDescription>
        </DialogHeader>

        {step === "selection" && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="doctor" className="text-sm font-medium">
                Select Doctor
              </label>
              <Select
                value={selectedDoctor}
                onValueChange={setSelectedDoctor}
                disabled={isDoctorsLoading}
              >
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors?.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name} - ₹
                      {doctor.consultation_fee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDoctor && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                {selectedDate && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Time</label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableTimeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          className="w-full"
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <Button
              className="w-full"
              disabled={!selectedDoctor || !selectedDate || !selectedTime}
              onClick={() => setStep("confirmation")}
            >
              Continue
            </Button>
          </div>
        )}

        {step === "confirmation" && (
          <div className="space-y-4 pt-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-medium">Appointment Details</p>
              <p>
                Doctor: Dr.{" "}
                {doctors?.find((d) => d.id === selectedDoctor)?.first_name}{" "}
                {doctors?.find((d) => d.id === selectedDoctor)?.last_name}
              </p>
              <p>Date: {format(selectedDate!, "PP")}</p>
              <p>Time: {selectedTime}</p>
              <p>
                Fee: ₹
                {doctors?.find((d) => d.id === selectedDoctor)?.consultation_fee}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep("selection")}
              >
                Back
              </Button>
              <Button className="w-full" onClick={handleConfirmAppointment}>
                Confirm & Pay
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4 pt-4">
            {paymentStep.status === "processing" && (
              <div className="text-center space-y-2">
                <Clock className="w-8 h-8 animate-spin mx-auto" />
                <p>Processing payment...</p>
              </div>
            )}

            {paymentStep.status === "success" && (
              <div className="text-center space-y-2 text-green-600">
                <CalendarIcon className="w-8 h-8 mx-auto" />
                <p>Appointment scheduled successfully!</p>
              </div>
            )}

            {paymentStep.status === "error" && (
              <div className="text-center space-y-2 text-destructive">
                <AlertCircle className="w-8 h-8 mx-auto" />
                <p>{paymentStep.error}</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep("selection")}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
