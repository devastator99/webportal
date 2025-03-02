
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
  onFieldChange?: () => void;
}

export function AppointmentFormFields({ 
  form, 
  callerRole, 
  onFieldChange 
}: AppointmentFormFieldsProps) {
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

  // Let's add field change listeners
  useEffect(() => {
    const subscription = form.watch(() => {
      if (onFieldChange) onFieldChange();
    });
    
    return () => subscription.unsubscribe();
  }, [form, onFieldChange]);

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
