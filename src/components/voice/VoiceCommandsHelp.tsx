
export const VoiceCommandsHelp: React.FC = () => {
  return (
    <div className="text-xs border-t pt-2 space-y-1">
      <h4 className="font-medium">Voice Commands:</h4>
      <p>"Schedule appointment" - Start scheduling</p>
      <p>"Select patient [name]" - Choose a patient</p>
      <p>"Select date [date]" - Choose a date</p>
      <p>"Select time [time]" - Choose a time</p>
      <p>"Confirm" - Book the appointment</p>
      <p>"Cancel" - Cancel scheduling</p>
    </div>
  );
};
