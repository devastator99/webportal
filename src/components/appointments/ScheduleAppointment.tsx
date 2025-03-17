
import React, { useState, useEffect } from "react";
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
import { Loader2, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  preSelectedDate?: Date;
  preSelectedTime?: string;
};

export const ScheduleAppointment = ({
  children,
  callerRole,
  preSelectedDoctorId,
  preSelectedPatientId,
  preSelectedDate,
  preSelectedTime,
}: ScheduleAppointmentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(preSelectedDate);
  const [selectedTime, setSelectedTime] = useState(preSelectedTime || "");
  const [selectedDoctor, setSelectedDoctor] = useState(preSelectedDoctorId || "");
  const [selectedPatient, setSelectedPatient] = useState(preSelectedPatientId || "");
  const [notes, setNotes] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (preSelectedDate) setSelectedDate(preSelectedDate);
    if (preSelectedTime) setSelectedTime(preSelectedTime);
    if (preSelectedDoctorId) setSelectedDoctor(preSelectedDoctorId);
    if (preSelectedPatientId) setSelectedPatient(preSelectedPatientId);
  }, [preSelectedDate, preSelectedTime, preSelectedDoctorId, preSelectedPatientId]);

  const { data: doctors = [], isLoading: isDoctorsLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_doctors");

      if (error) {
        console.error("Error fetching doctors:", error);
        throw new Error(error.message);
      }

      return data as DoctorProfile[];
    },
    enabled: callerRole === "patient" || callerRole === "reception",
  });

  const { data: patients = [], isLoading: isPatientsLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_patients");

      if (error) {
        console.error("Error fetching patients:", error);
        throw new Error(error.message);
      }

      return data as PatientProfile[];
    },
    enabled: callerRole === "doctor" || callerRole === "reception",
  });

  const timeSlots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      timeSlots.push(time);
    }
  }

  const isDoctorMissing = (callerRole === "patient" || callerRole === "reception") && !selectedDoctor;
  const isPatientMissing = (callerRole === "doctor" || callerRole === "reception") && !selectedPatient;
  const isDateMissing = !selectedDate;
  const isTimeMissing = !selectedTime;
  
  const hasError = isDoctorMissing || isPatientMissing || isDateMissing || isTimeMissing;

  const handleScheduleAppointment = async () => {
    setShowValidation(true);
    
    if (hasError) {
      let missingFields = [];
      if (isDoctorMissing) missingFields.push("Doctor");
      if (isPatientMissing) missingFields.push("Patient");
      if (isDateMissing) missingFields.push("Date");
      if (isTimeMissing) missingFields.push("Time");
      
      toast({
        title: "Missing information",
        description: `Please fill in all required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    const timeComponents = selectedTime.split(":");
    const appointmentDate = new Date(selectedDate as Date);
    appointmentDate.setHours(parseInt(timeComponents[0], 10));
    appointmentDate.setMinutes(parseInt(timeComponents[1], 10));

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

      const formattedDate = appointmentDate.toISOString();

      let patientId = selectedPatient;
      if (callerRole === "patient" && user) {
        patientId = user.id;
      }

      let doctorId = selectedDoctor;
      if (callerRole === "doctor" && user) {
        doctorId = user.id;
      }

      if (!patientId || patientId === "") {
        throw new Error("Invalid patient ID");
      }

      if (!doctorId || doctorId === "") {
        throw new Error("Invalid doctor ID");
      }

      // First create the appointment without notes
      const { data, error } = await supabase.rpc("create_appointment", {
        p_patient_id: patientId,
        p_doctor_id: doctorId,
        p_scheduled_at: formattedDate,
        p_status: "scheduled"
      });

      if (error) {
        throw error;
      }

      // If notes are provided, update the appointment with notes
      if (notes && notes.trim() !== "") {
        const appointmentId = data[0].appointment_id;
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ notes: notes })
          .eq('id', appointmentId);
          
        if (updateError) {
          console.error("Error updating appointment notes:", updateError);
          // We don't throw here as the appointment was created successfully
        }
      }

      toast({
        title: "Appointment scheduled",
        description: `Appointment scheduled for ${format(appointmentDate, "PPP 'at' h:mm a")}`,
      });

      setSelectedDate(undefined);
      setSelectedTime("");
      setNotes("");
      setShowValidation(false);
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

  const RequiredFieldIndicator = () => (
    <span className="text-red-500 ml-1">*</span>
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowValidation(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>{children}</DialogTrigger>
      <DialogContent className={`${isMobile ? 'w-[95vw] p-4' : 'sm:max-w-[500px]'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-center sm:text-left">Schedule an Appointment</DialogTitle>
          <DialogDescription className="text-center sm:text-left">
            Fill out the form below to schedule a new appointment. Fields marked with <span className="text-red-500">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:py-4">
          {(callerRole === "patient" || callerRole === "reception") && (
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-1' : 'grid-cols-4 items-center gap-2'}`}>
              <Label htmlFor="doctor" className={`${isMobile ? "mb-1" : "text-right"} ${showValidation && isDoctorMissing ? "text-red-500" : ""}`}>
                Doctor<RequiredFieldIndicator />
              </Label>
              <div className={isMobile ? "w-full" : "col-span-3"}>
                <Select
                  value={selectedDoctor}
                  onValueChange={setSelectedDoctor}
                  disabled={isDoctorsLoading || !!preSelectedDoctorId}
                >
                  <SelectTrigger className={showValidation && isDoctorMissing ? "border-red-500" : ""}>
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
                {showValidation && isDoctorMissing && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> Required field
                  </p>
                )}
              </div>
            </div>
          )}

          {(callerRole === "doctor" || callerRole === "reception") && (
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-1' : 'grid-cols-4 items-center gap-2'}`}>
              <Label htmlFor="patient" className={`${isMobile ? "mb-1" : "text-right"} ${showValidation && isPatientMissing ? "text-red-500" : ""}`}>
                Patient<RequiredFieldIndicator />
              </Label>
              <div className={isMobile ? "w-full" : "col-span-3"}>
                <Select
                  value={selectedPatient}
                  onValueChange={setSelectedPatient}
                  disabled={isPatientsLoading || !!preSelectedPatientId}
                >
                  <SelectTrigger className={showValidation && isPatientMissing ? "border-red-500" : ""}>
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
                {showValidation && isPatientMissing && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> Required field
                  </p>
                )}
              </div>
            </div>
          )}

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-1' : 'grid-cols-4 items-center gap-2'}`}>
            <Label htmlFor="date" className={`${isMobile ? "mb-1" : "text-right"} ${showValidation && isDateMissing ? "text-red-500" : ""}`}>
              Date<RequiredFieldIndicator />
            </Label>
            <div className={isMobile ? "w-full" : "col-span-3"}>
              <div className="flex flex-col space-y-2">
                <div className="flex w-full items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      showValidation && isDateMissing ? "border-red-500" : ""
                    }`}
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
                  className={`border rounded-md p-2 sm:p-3 mx-auto w-full pointer-events-auto ${
                    showValidation && isDateMissing ? "border-red-500" : ""
                  }`}
                />
                {showValidation && isDateMissing && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> Required field
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-1' : 'grid-cols-4 items-center gap-2'}`}>
            <Label htmlFor="time" className={`${isMobile ? "mb-1" : "text-right"} ${showValidation && isTimeMissing ? "text-red-500" : ""}`}>
              Time<RequiredFieldIndicator />
            </Label>
            <div className={isMobile ? "w-full" : "col-span-3"}>
              <Select 
                value={selectedTime} 
                onValueChange={setSelectedTime}
              >
                <SelectTrigger className={showValidation && isTimeMissing ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh]">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {format(parse(time, "HH:mm", new Date()), "h:mm a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showValidation && isTimeMissing && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> Required field
                </p>
              )}
            </div>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-1' : 'grid-cols-4 items-center gap-2'}`}>
            <Label htmlFor="notes" className={isMobile ? "mb-1" : "text-right"}>
              Notes
            </Label>
            <Textarea
              id="notes"
              className={isMobile ? "w-full" : "col-span-3"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or special instructions"
            />
          </div>
        </div>

        <DialogFooter className={isMobile ? "flex-col space-y-2 mt-2" : ""}>
          <Button 
            type="button"
            onClick={handleScheduleAppointment} 
            disabled={isSubmitting}
            className={`bg-primary text-white ${isMobile ? 'w-full' : ''}`}
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
