import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Doctor {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface ScheduleAppointmentProps {
  children: React.ReactNode;
}

export const ScheduleAppointment = ({ children }: ScheduleAppointmentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedDoctor, setSelectedDoctor] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      // First get all users with doctor role
      const { data: userRoles, error: userRolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "doctor");

      if (userRolesError) throw userRolesError;

      if (!userRoles?.length) return [] as Doctor[];

      const doctorIds = userRoles.map(role => role.user_id);

      // Then get their profile information
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", doctorIds);

      if (profilesError) throw profilesError;
      return (profiles || []) as Doctor[];
    },
  });

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  const handleFileUpload = async (file: File) => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('medical_files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('medical_files')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedDoctor || !user) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      scheduledAt.setHours(parseInt(hours), parseInt(minutes));

      let fileUrl = null;
      if (file) {
        fileUrl = await handleFileUpload(file);
      }

      const { error } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          doctor_id: selectedDoctor,
          scheduled_at: scheduledAt.toISOString(),
          status: "scheduled",
          notes: fileUrl ? `Attached document: ${fileUrl}` : null,
        });

      if (error) throw error;

      toast({
        title: "Appointment scheduled successfully",
      });
      setIsOpen(false);
      setSelectedDate(undefined);
      setSelectedTime(undefined);
      setSelectedDoctor(undefined);
      setFile(null);
    } catch (error: any) {
      toast({
        title: "Error scheduling appointment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule an Appointment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Select Doctor</label>
            <Select
              value={selectedDoctor}
              onValueChange={setSelectedDoctor}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors?.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.first_name} {doctor.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Select Date</label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => 
                date < new Date() || 
                date.getDay() === 0 || 
                date.getDay() === 6
              }
              className="rounded-md border"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Select Time</label>
            <Select
              value={selectedTime}
              onValueChange={setSelectedTime}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a time">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{selectedTime || "Select time"}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Upload Document (Optional)</label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>

          <Button onClick={handleSchedule}>
            Schedule Appointment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};