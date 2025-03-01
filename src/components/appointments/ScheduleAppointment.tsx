
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

const formSchema = z.object({
  patientId: z.string().min(2, {
    message: "Patient ID must be at least 2 characters.",
  }),
  doctorId: z.string().min(2, {
    message: "Doctor ID must be at least 2 characters.",
  }),
  scheduledAt: z.string().min(2, {
    message: "Date is required"
  }),
  notes: z.string().optional(),
});

interface ScheduleAppointmentProps {
  children: React.ReactNode;
  callerRole: "patient" | "doctor" | "reception";
}

export function ScheduleAppointment({ children, callerRole }: ScheduleAppointmentProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      doctorId: '',
      scheduledAt: '',
      notes: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    createAppointmentMutation.mutate(values);
  }

  // Define the appointment type for mutation
  type AppointmentInput = z.infer<typeof formSchema>;
  type AppointmentResponse = unknown;

  const createAppointmentMutation = useMutation<
    AppointmentResponse, 
    Error, 
    AppointmentInput
  >({
    mutationFn: async (newAppointment: AppointmentInput) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            patient_id: newAppointment.patientId,
            doctor_id: newAppointment.doctorId,
            scheduled_at: newAppointment.scheduledAt,
            notes: newAppointment.notes,
            status: 'scheduled',
            email_notification_sent: false,
            whatsapp_notification_sent: false,
          },
        ]);

      if (error) {
        console.error("Error creating appointment:", error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Success",
        description: "Appointment created successfully!",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create appointment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Type for patient data
  type PatientProfile = Database['public']['Tables']['profiles']['Row'];
  
  const { data: patients, isLoading: isLoadingPatients } = useQuery<PatientProfile[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      // Only run this query if not in doctor role
      if (callerRole === "doctor") {
        return [];
      }
      
      let patientIds: string[] = [];
      
      // If doctor, get assigned patients
      if (user?.id) {
        const { data: assignedPatients, error: assignmentError } = await supabase
          .from('patient_assignments')
          .select('patient_id')
          .eq('doctor_id', user.id);
          
        if (assignmentError) {
          console.error("Error fetching patient assignments:", assignmentError);
          throw new Error(assignmentError.message);
        }
        
        patientIds = (assignedPatients || []).map(item => item.patient_id);
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds.length > 0 ? patientIds : ['00000000-0000-0000-0000-000000000000']);
        
      if (error) {
        console.error("Error fetching patients:", error);
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: callerRole !== "doctor",
  });

  // Type for doctor data
  type DoctorProfile = Database['public']['Tables']['profiles']['Row'];
  
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<DoctorProfile[]>({
    queryKey: ['doctors'],
    queryFn: async () => {
      // Only run this query if not in patient role
      if (callerRole === "patient") {
        return [];
      }
      
      let doctorIds: string[] = [];
      
      // If patient, get assigned doctors
      if (user?.id) {
        const { data: assignedDoctors, error: assignmentError } = await supabase
          .from('patient_assignments')
          .select('doctor_id')
          .eq('patient_id', user.id);
          
        if (assignmentError) {
          console.error("Error fetching doctor assignments:", assignmentError);
          throw new Error(assignmentError.message);
        }
        
        doctorIds = (assignedDoctors || []).map(item => item.doctor_id);
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', doctorIds.length > 0 ? doctorIds : ['00000000-0000-0000-0000-000000000000']);
        
      if (error) {
        console.error("Error fetching doctors:", error);
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: callerRole !== "patient",
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Schedule Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            Schedule a new appointment for a patient.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {callerRole !== "patient" && (
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients && patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {callerRole !== "doctor" && (
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors && doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>{doctor.first_name} {doctor.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Scheduled Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        {date ? format(date, "PPP") : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => {
                          setDate(date);
                          field.onChange(date ? format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : "");
                        }}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes for the appointment."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={createAppointmentMutation.isPending}>
                {createAppointmentMutation.isPending ? "Submitting..." : "Submit"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
