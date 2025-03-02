
import { UseFormReturn } from "react-hook-form";
import { AppointmentFormData } from "../schedule/schema";
import { PatientSelector } from "../schedule/PatientSelector"; 
import { DoctorSelector } from "../schedule/DoctorSelector";
import { NotesField } from "../schedule/NotesField";
import { NewDateSelector } from "./NewDateSelector";

interface NewAppointmentFormFieldsProps {
  form: UseFormReturn<AppointmentFormData>;
  callerRole: "patient" | "doctor" | "reception";
}

export function NewAppointmentFormFields({ 
  form, 
  callerRole 
}: NewAppointmentFormFieldsProps) {
  return (
    <>
      {/* Reuse existing PatientSelector */}
      <PatientSelector form={form} />
      
      {/* Reuse existing DoctorSelector */}
      <DoctorSelector form={form} />
      
      {/* Use our new DateSelector */}
      <NewDateSelector form={form} />
      
      {/* Reuse existing NotesField */}
      <NotesField form={form} />
    </>
  );
}
