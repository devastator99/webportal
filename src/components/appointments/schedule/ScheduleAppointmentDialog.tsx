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

  function handleFieldChange() {
    console.log("Field changed, dialog remains open");
  }

  function onSubmit(values: AppointmentFormData) {
    console.log("Submitting appointment data:", values);
    createAppointmentMutation.mutate(values);
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
    },
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
            <AppointmentFormFields 
              form={form}
              callerRole={callerRole}
              onFieldChange={handleFieldChange}
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
