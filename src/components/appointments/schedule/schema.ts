
import * as z from "zod";

export const appointmentFormSchema = z.object({
  patientId: z.string().min(1, {
    message: "Patient must be selected",
  }),
  doctorId: z.string().min(1, {
    message: "Doctor must be selected",
  }),
  scheduledAt: z.string().min(1, {
    message: "Date is required"
  }),
  notes: z.string().optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;
