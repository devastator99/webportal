
import { NewScheduleAppointmentDialog } from "./NewScheduleAppointmentDialog";

export function NewScheduleAppointment(props: {
  children: React.ReactNode;
  callerRole: "patient" | "doctor" | "reception";
}) {
  return <NewScheduleAppointmentDialog {...props} />;
}
