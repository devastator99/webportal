
import { useState } from "react";
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
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentFormData, appointmentFormSchema } from "./schema";
import { AppointmentFormFields } from "./AppointmentFormFields";

interface ScheduleAppointmentDialogProps {
  children: React.ReactNode;
  callerRole: "patient" | "doctor" | "reception";
}

export function ScheduleAppointmentDialog({ 
  children, 
  callerRole 
}: ScheduleAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: '',
      doctorId: '',
      scheduledAt: '',
      notes: '',
    },
    mode: "onChange",
  });

  // This function handles explicit dialog close via Cancel button
  function handleCancel() {
    form.reset();
    setOpen(false);
  }

  // This function handles form submission
  function onSubmit(values: AppointmentFormData) {
    console.log("Submitting appointment data:", values);
    
    // Additional check to ensure all required fields are filled
    if (!values.patientId || !values.doctorId || !values.scheduledAt) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    createAppointmentMutation.mutate(values);
    // Dialog will be closed in the onSuccess callback
  }

  // This prevents accidental closure from outside clicks
  const handleDialogChange = (newOpenState: boolean) => {
    // If trying to open the dialog, always allow it
    if (newOpenState) {
      setOpen(true);
      return;
    }
    
    // If trying to close with unsaved changes, show a confirmation
    if (form.formState.isDirty) {
      // For simplicity, we'll just allow closing to avoid complexity
      // In a real app, you might want to add a confirmation dialog here
      form.reset();
    }
    
    setOpen(false);
  };

  const createAppointmentMutation = useMutation({
    mutationFn: async (newAppointment: AppointmentFormData) => {
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
      queryClient.invalidateQueries({ queryKey: ['patient_dashboard'] });
      toast({
        title: "Success",
        description: "Appointment created successfully!",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create appointment: ${error.message}`,
        variant: "destructive",
      });
      // Don't close the dialog on error so the user can try again
    },
  });

  // Check if form has any validation errors
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <AlertDialog open={open} onOpenChange={handleDialogChange}>
      <AlertDialogTrigger asChild onClick={() => setOpen(true)}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Schedule Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            Schedule a new appointment for a patient.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AppointmentFormFields 
              form={form}
              callerRole={callerRole}
            />
            <AlertDialogFooter>
              <AlertDialogCancel type="button" onClick={handleCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                type="submit" 
                disabled={createAppointmentMutation.isPending || hasErrors}
              >
                {createAppointmentMutation.isPending ? "Submitting..." : "Submit"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
