
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
import { toast } from "@/components/ui/use-toast";
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
  
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: '',
      doctorId: '',
      scheduledAt: '',
      notes: '',
    },
  });

  // This function is called when fields change but should not close the dialog
  function handleFieldChange() {
    // Just log the change, but don't close the dialog
    console.log("Field changed, dialog remains open");
  }

  function onSubmit(values: AppointmentFormData) {
    console.log("Submitting appointment data:", values);
    createAppointmentMutation.mutate(values);
    // Dialog will be closed in the onSuccess callback after successful submission
  }

  function handleCancel() {
    // Only close the dialog when cancel is explicitly clicked
    setOpen(false);
    form.reset();
  }

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
      // Don't close the dialog on error so the user can try again
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={(newOpen) => {
      // Only allow closing from the "X" button, prevent closing from clicking outside
      if (!newOpen) {
        // If dialog is being closed, we check if it's an explicit action
        // The explicit actions are handled by submit and handleCancel
        // This just prevents accidental closures
        console.log("Dialog close attempt intercepted");
      } else {
        // Always allow opening
        setOpen(true);
      }
    }}>
      <AlertDialogTrigger asChild onClick={() => setOpen(true)}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent onPointerDownOutside={(e) => {
        // Prevent closing when clicking outside the dialog
        e.preventDefault();
      }}>
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
              onFieldChange={handleFieldChange}
            />
            <AlertDialogFooter>
              <AlertDialogCancel type="button" onClick={handleCancel}>Cancel</AlertDialogCancel>
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
