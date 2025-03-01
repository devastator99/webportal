
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
import { useState, useEffect } from "react";
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

  // Pre-fill the form with current user's ID based on role
  useEffect(() => {
    if (user?.id) {
      if (callerRole === "doctor") {
        form.setValue("doctorId", user.id);
      } else if (callerRole === "patient") {
        form.setValue("patientId", user.id);
      }
    }
  }, [user, callerRole, form]);

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

  // Fetch patients for doctor - improved approach to avoid RLS issues
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['doctor_patients', user?.id],
    queryFn: async () => {
      if (!user?.id || callerRole !== "doctor") {
        return [];
      }
      
      console.log("Fetching patients for doctor:", user.id);
      
      try {
        // Get patient assignments directly
        const { data: assignments, error: assignmentsError } = await supabase
          .from('patient_assignments')
          .select('patient_id')
          .eq('doctor_id', user.id);
        
        if (assignmentsError) {
          console.error("Error fetching patient assignments:", assignmentsError);
          throw assignmentsError;
        }
        
        if (!assignments || assignments.length === 0) {
          console.log("No patients assigned to doctor:", user.id);
          return [];
        }
        
        // Extract patient IDs
        const patientIds = assignments.map(a => a.patient_id);
        
        // Get patient profiles in a separate query
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', patientIds);
        
        if (profilesError) {
          console.error("Error fetching patient profiles:", profilesError);
          throw profilesError;
        }
        
        console.log(`Found ${profiles?.length || 0} patients for doctor ${user.id}`);
        return profiles || [];
      } catch (error) {
        console.error("Error fetching patients:", error);
        return [];
      }
    },
    enabled: !!user?.id && callerRole === "doctor",
  });

  // Fetch doctors for patient
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['patient_doctors', user?.id],
    queryFn: async () => {
      if (!user?.id || callerRole !== "patient") {
        return [];
      }
      
      try {
        // First get the doctor assignments
        const { data: doctorAssignments, error: assignmentError } = await supabase
          .from('patient_assignments')
          .select('doctor_id')
          .eq('patient_id', user.id);
          
        if (assignmentError) {
          console.error("Error fetching doctor assignments:", assignmentError);
          throw assignmentError;
        }
        
        if (!doctorAssignments || doctorAssignments.length === 0) {
          return [];
        }
        
        const doctorIds = doctorAssignments.map(item => item.doctor_id);
        
        // Then get the doctor profiles
        const { data: doctorProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', doctorIds);
          
        if (profilesError) {
          console.error("Error fetching doctor profiles:", profilesError);
          throw profilesError;
        }
        
        return doctorProfiles || [];
      } catch (error) {
        console.error("Error fetching doctors:", error);
        return [];
      }
    },
    enabled: !!user?.id && callerRole === "patient",
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
            {callerRole === "doctor" && (
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
                        {isLoadingPatients ? (
                          <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                        ) : patients && patients.length > 0 ? (
                          patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.first_name} {patient.last_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No patients assigned to you</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {callerRole === "patient" && (
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
                        {isLoadingDoctors ? (
                          <SelectItem value="loading" disabled>Loading doctors...</SelectItem>
                        ) : doctors && doctors.length > 0 ? (
                          doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.first_name} {doctor.last_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No doctors assigned to you</SelectItem>
                        )}
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
