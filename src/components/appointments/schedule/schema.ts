
import * as z from "zod";

export const appointmentFormSchema = z.object({
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

export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;
