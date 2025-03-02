
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { AppointmentFormData } from "./schema";
import { DateSelector } from "./DateSelector";
import { PatientSelector } from "./PatientSelector";
import { DoctorSelector } from "./DoctorSelector";
import { NotesField } from "./NotesField";

interface AppointmentFormFieldsProps {
  form: UseFormReturn<AppointmentFormData>;
  callerRole: "patient" | "doctor" | "reception";
}

export function AppointmentFormFields({ form, callerRole }: AppointmentFormFieldsProps) {
  const { user } = useAuth();

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

  return (
    <>
      {callerRole === "doctor" && (
        <PatientSelector form={form} />
      )}

      {callerRole === "patient" && (
        <DoctorSelector form={form} />
      )}

      <DateSelector form={form} />
      <NotesField form={form} />
    </>
  );
}
