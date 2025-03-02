
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { format, parse, addHours, addMinutes, isAfter, isBefore, startOfDay } from "date-fns";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";

type DoctorProfile = {
  id: string;
  first_name: string;
  last_name: string;
};

type PatientProfile = {
  id: string;
  first_name: string;
  last_name: string;
};

type ScheduleAppointmentProps = {
  children: React.ReactNode;
  callerRole: "doctor" | "patient" | "reception";
  preSelectedDoctorId?: string;
  preSelectedPatientId?: string;
};

export const ScheduleAppointment = ({
  children,
  callerRole,
  preSelectedDoctorId,
  preSelectedPatientId,
}: ScheduleAppointmentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(preSelectedDoctorId || "");
  const [selectedPatient, setSelectedPatient] = useState(preSelectedPatientId || "");
  const [notes, setNotes] = useState("");

  // Fetch doctors list
  const { data: doctors = [], isLoading: isDoctorsLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("user_id", "user_roles.user_id")
        .eq("user_roles.role", "doctor")
        .order("first_name", { ascending: true });

      if (error) {
        console.error("Error fetching doctors:", error);
        throw new Error(error.message);
      }

      return data as DoctorProfile[];
    },
    enabled: callerRole === "patient" || callerRole === "reception",
  });

  // Fetch patients list
  const { data: patients = [], isLoading: isPatientsLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("user_id", "user_roles.user_id")
        .eq("user_roles.role", "patient")
        .order("first_name", { ascending: true });

      if (error) {
        console.error("Error fetching patients:", error);
        throw new Error(error.message);
      }

      return data as PatientProfile[];
    },
    enabled: callerRole === "doctor" || callerRole === "reception",
  });

  // Generate time slots (9 AM to 5 PM with 30-minute intervals)
  const timeSlots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      timeSlots.push(time);
    }
  }

  const handleScheduleAppointment = async () => {
    if (!selectedDate || !selectedTime || !selectedDoctor || !selectedPatient) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const timeComponents = selectedTime.split(":");
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(parseInt(timeComponents[0], 10));
    appointmentDate.setMinutes(parseInt(timeComponents[1], 10));

    // Check if the selected date/time is in the past
    if (isBefore(appointmentDate, new Date())) {
      toast({
        title: "Invalid appointment time",
        description: "Cannot schedule appointments in the past",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Format the date in ISO format for database storage
      const formattedDate = appointmentDate.toISOString();

      // Call the create_appointment RPC function
      const { data, error } = await supabase.rpc("create_appointment", {
        p_patient_id: selectedPatient,
        p_doctor_id: selectedDoctor,
        p_scheduled_at: formattedDate,
        p_status: "scheduled"
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Appointment scheduled",
        description: `Appointment scheduled for ${format(appointmentDate, "PPP 'at' h:mm a")}`,
      });

      // Reset form and close dialog
      setSelectedDate(undefined);
      setSelectedTime("");
      setNotes("");
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error scheduling appointment",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule an Appointment</DialogTitle>
          <DialogDescription>
            Fill out the form below to schedule a new appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Doctor selection */}
          {(callerRole === "patient" || callerRole === "reception") && (
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="doctor" className="text-right">
                Doctor
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedDoctor}
                  onValueChange={setSelectedDoctor}
                  disabled={isDoctorsLoading || !!preSelectedDoctorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Patient selection */}
          {(callerRole === "doctor" || callerRole === "reception") && (
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="patient" className="text-right">
                Patient
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedPatient}
                  onValueChange={setSelectedPatient}
                  disabled={isPatientsLoading || !!preSelectedPatientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Date picker */}
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <div className="col-span-3">
              <div className="flex flex-col space-y-2">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={(e) => e.preventDefault()}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < startOfDay(new Date())}
                  className="border rounded-md p-3"
                />
              </div>
            </div>
          </div>

          {/* Time picker */}
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="time" className="text-right">
              Time
            </Label>
            <div className="col-span-3">
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {format(parse(time, "HH:mm", new Date()), "h:mm a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              className="col-span-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or special instructions"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleScheduleAppointment} 
            disabled={isSubmitting}
            className="bg-primary text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...
              </>
            ) : (
              "Schedule Appointment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
