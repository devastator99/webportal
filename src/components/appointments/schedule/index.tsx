
import { ScheduleAppointmentDialog } from "./ScheduleAppointmentDialog";

export function ScheduleAppointment(props: {
  children: React.ReactNode;
  callerRole: "patient" | "doctor" | "reception";
}) {
  return <ScheduleAppointmentDialog {...props} />;
}
