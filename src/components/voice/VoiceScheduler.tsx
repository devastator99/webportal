
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useVoiceScheduling } from "@/hooks/useVoiceScheduling";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSelector } from "@/components/voice/LanguageSelector";
import { MicrophoneButton } from "@/components/voice/MicrophoneButton";
import { CurrentSelections } from "@/components/voice/CurrentSelections";
import { VoiceCommandsHelp } from "@/components/voice/VoiceCommandsHelp";
import { AppointmentConfirmation } from "@/components/voice/AppointmentConfirmation";
import { speak } from "@/utils/textToSpeech";
import { format } from "date-fns";
import { extractDate, extractTime } from "@/utils/VoiceAgent";

interface VoiceSchedulerProps {
  onClose: () => void;
}

export const VoiceScheduler: React.FC<VoiceSchedulerProps> = ({ onClose }) => {
  const [sourceLanguage, setSourceLanguage] = useState<string>("en");
  const { translateText, isTranslating, setIsTranslating } = useTranslation();
  
  const {
    schedulingStep,
    setSchedulingStep,
    selectedPatient,
    setSelectedPatient,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    showConfirmation,
    setShowConfirmation,
    appointmentDetails,
    isScheduling,
    stateRef,
    patients,
    isTimeSlotBooked,
    scheduleAppointment,
    resetScheduling
  } = useVoiceScheduling();

  const handleCommand = async (command: string, params: string) => {
    console.log(`Command detected: ${command}, params: ${params}`);
    
    if (sourceLanguage !== "en") {
      try {
        params = await translateText(params, sourceLanguage, "en");
        console.log(`Translated params: "${params}"`);
      } catch (err) {
        console.error("Failed to translate params:", err);
      }
    }
    
    switch (command) {
      case "START_SCHEDULING":
        setSchedulingStep("SELECT_PATIENT");
        const startMessage = "Which patient would you like to schedule for?";
        speak(sourceLanguage === "en" ? startMessage : await translateText(startMessage, "en", sourceLanguage), sourceLanguage);
        break;
        
      case "SELECT_PATIENT":
        const patientName = params.trim().toLowerCase();
        const foundPatient = patients.find(
          (p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientName)
        );
        
        if (foundPatient) {
          setSelectedPatient(foundPatient.id);
          setSchedulingStep("SELECT_DATE");
          const patientMessage = `Patient ${foundPatient.first_name} ${foundPatient.last_name} selected. What date would you like to schedule?`;
          speak(sourceLanguage === "en" ? patientMessage : await translateText(patientMessage, "en", sourceLanguage), sourceLanguage);
        } else {
          const notFoundMessage = "Patient not found. Please try again or say the full name.";
          speak(sourceLanguage === "en" ? notFoundMessage : await translateText(notFoundMessage, "en", sourceLanguage), sourceLanguage);
        }
        break;
        
      case "SELECT_DATE":
        const date = extractDate(params);
        if (date) {
          setSelectedDate(date);
          setSchedulingStep("SELECT_TIME");
          const dateMessage = `Date set to ${format(date, "MMMM do, yyyy")}. What time would you like to schedule?`;
          speak(sourceLanguage === "en" ? dateMessage : await translateText(dateMessage, "en", sourceLanguage), sourceLanguage);
        } else {
          const dateErrorMessage = "I couldn't understand the date. Please say a date like tomorrow or next Monday.";
          speak(sourceLanguage === "en" ? dateErrorMessage : await translateText(dateErrorMessage, "en", sourceLanguage), sourceLanguage);
        }
        break;
        
      case "SELECT_TIME":
        const time = extractTime(params);
        if (time) {
          if (stateRef.current.selectedDate && isTimeSlotBooked(stateRef.current.selectedDate, time)) {
            const timeBookedMessage = "This time slot is already booked. Please select a different time.";
            speak(sourceLanguage === "en" ? timeBookedMessage : await translateText(timeBookedMessage, "en", sourceLanguage), sourceLanguage);
            return;
          }
          
          setSelectedTime(time);
          setSchedulingStep("CONFIRM");
          
          const patient = patients.find(p => p.id === stateRef.current.selectedPatient);
          const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "the selected patient";
          
          setTimeout(async () => {
            const confirmMessage = `Ready to schedule appointment for ${patientName} on ${stateRef.current.selectedDate ? format(stateRef.current.selectedDate, "MMMM do, yyyy") : "the selected date"} at ${time}. Please say confirm to book the appointment.`;
            speak(sourceLanguage === "en" ? confirmMessage : await translateText(confirmMessage, "en", sourceLanguage), sourceLanguage);
          }, 100);
        } else {
          const timeErrorMessage = "I couldn't understand the time. Please say a time like 2 PM or 14:30.";
          speak(sourceLanguage === "en" ? timeErrorMessage : await translateText(timeErrorMessage, "en", sourceLanguage), sourceLanguage);
        }
        break;
        
      case "CONFIRM":
        const currentPatient = stateRef.current.selectedPatient;
        const currentDate = stateRef.current.selectedDate;
        const currentTime = stateRef.current.selectedTime;
        
        console.log("Confirmation command received with current state:", {
          patient: currentPatient,
          date: currentDate ? currentDate.toISOString() : null,
          time: currentTime
        });
        
        if (currentPatient && currentDate && currentTime) {
          if (isTimeSlotBooked(currentDate, currentTime)) {
            const slotBookedMessage = "Sorry, this time slot has just been booked by someone else. Please select a different time.";
            speak(sourceLanguage === "en" ? slotBookedMessage : await translateText(slotBookedMessage, "en", sourceLanguage), sourceLanguage);
            setSchedulingStep("SELECT_TIME");
            return;
          }
          
          console.log("All information present, scheduling appointment");
          const result = await scheduleAppointment(currentPatient, currentDate, currentTime);
          
          if (result && result.success) {
            const successMessage = "Appointment scheduled successfully. " + result.confirmationText;
            speak(sourceLanguage === "en" ? successMessage : await translateText(successMessage, "en", sourceLanguage), sourceLanguage);
            stopListening();
          } else if (result && result.error === "time_slot_booked") {
            const slotBookedMessage = "This time slot is already booked. Please select a different time.";
            speak(sourceLanguage === "en" ? slotBookedMessage : await translateText(slotBookedMessage, "en", sourceLanguage), sourceLanguage);
          } else {
            const errorMessage = "There was an error scheduling the appointment. Please try again.";
            speak(sourceLanguage === "en" ? errorMessage : await translateText(errorMessage, "en", sourceLanguage), sourceLanguage);
          }
        } else {
          console.log("Missing information:", {
            patient: currentPatient,
            date: currentDate,
            time: currentTime
          });
          
          const missingItems = [];
          if (!currentPatient) missingItems.push("patient");
          if (!currentDate) missingItems.push("date");
          if (!currentTime) missingItems.push("time");
          
          const missingMessage = `Missing information: ${missingItems.join(", ")}. Please provide all required information before confirming.`;
          speak(sourceLanguage === "en" ? missingMessage : await translateText(missingMessage, "en", sourceLanguage), sourceLanguage);
        }
        break;
        
      case "CANCEL":
        resetScheduling();
        const cancelMessage = "Appointment scheduling cancelled.";
        speak(sourceLanguage === "en" ? cancelMessage : await translateText(cancelMessage, "en", sourceLanguage), sourceLanguage);
        break;
        
      default:
        const unknownMessage = "I didn't understand that command. Please try again.";
        speak(sourceLanguage === "en" ? unknownMessage : await translateText(unknownMessage, "en", sourceLanguage), sourceLanguage);
    }
  };

  const {
    listening,
    voiceStatus,
    toggleListening,
    stopListening
  } = useVoiceRecognition({
    onCommand: handleCommand,
    sourceLanguage
  });

  const handleLanguageChange = (language: string) => {
    if (listening) {
      stopListening();
    }
    setSourceLanguage(language);
  };

  return (
    <Card className="shadow-lg max-w-md w-full">
      <CardHeader className="bg-[#9b87f5] text-white py-3 px-4">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Voice Appointment Scheduler</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="hover:bg-[#8a75e7] text-white h-7 px-2"
          >
            Close
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[400px] pr-2">
          {showConfirmation ? (
            <AppointmentConfirmation 
              appointmentDetails={appointmentDetails}
              onScheduleAnother={resetScheduling}
              onClose={onClose}
            />
          ) : (
            <div className="space-y-4">
              <LanguageSelector 
                sourceLanguage={sourceLanguage}
                onLanguageChange={handleLanguageChange}
                disabled={listening || isTranslating || isScheduling}
              />
              
              <MicrophoneButton 
                listening={listening}
                onClick={toggleListening}
                disabled={isTranslating || isScheduling}
              />
              
              <div className="text-center text-muted-foreground text-xs">
                {isTranslating ? "Translating..." : 
                  isScheduling ? "Scheduling appointment..." : voiceStatus}
              </div>
              
              <CurrentSelections 
                selectedPatient={selectedPatient}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                patients={patients}
              />
              
              <VoiceCommandsHelp />
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
