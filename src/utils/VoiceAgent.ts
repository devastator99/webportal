
import { useToast } from "@/hooks/use-toast";

// Types for speech recognition
interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

// Commands dictionary for appointment scheduling
export const schedulingCommands = {
  START_SCHEDULING: ["schedule appointment", "schedule a new appointment", "create appointment", "new appointment"],
  SELECT_PATIENT: ["select patient", "choose patient", "for patient"],
  SELECT_DATE: ["select date", "choose date", "on date", "schedule for"],
  SELECT_TIME: ["select time", "choose time", "at time", "schedule at"],
  CONFIRM: ["confirm", "book appointment", "schedule it", "confirm appointment"],
  CANCEL: ["cancel", "stop", "cancel scheduling"],
};

export class VoiceAgent {
  private recognition: any;
  private isListening: boolean = false;
  private commandCallback: (command: string, params: string) => void;
  private statusCallback: (status: string) => void;
  
  constructor(
    commandCallback: (command: string, params: string) => void,
    statusCallback: (status: string) => void
  ) {
    this.commandCallback = commandCallback;
    this.statusCallback = statusCallback;
    
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.statusCallback("Speech recognition not supported in this browser");
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";
    
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("Voice recognized:", transcript);
      this.statusCallback(`Heard: ${transcript}`);
      this.processCommand(transcript);
    };
    
    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      this.statusCallback(`Error: ${event.error}`);
    };
    
    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition.start();
      }
    };
  }
  
  private processCommand(transcript: string): void {
    // Check for command matches
    for (const [commandType, phrases] of Object.entries(schedulingCommands)) {
      for (const phrase of phrases) {
        if (transcript.includes(phrase)) {
          const params = transcript.replace(phrase, "").trim();
          this.commandCallback(commandType, params);
          return;
        }
      }
    }
    
    // If no specific command was matched
    this.statusCallback("Command not recognized. Try again.");
  }
  
  public start(): void {
    if (!this.recognition) return;
    
    try {
      this.isListening = true;
      this.recognition.start();
      this.statusCallback("Listening...");
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      this.statusCallback("Failed to start listening");
    }
  }
  
  public stop(): void {
    if (!this.recognition) return;
    
    this.isListening = false;
    this.recognition.stop();
    this.statusCallback("Voice recognition stopped");
  }
}

// Helper function to extract date from voice command
export const extractDate = (params: string): Date | null => {
  // Check for common date formats in speech
  const today = new Date();
  
  if (params.includes("today")) {
    return today;
  }
  
  if (params.includes("tomorrow")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  }
  
  if (params.includes("next week")) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek;
  }
  
  // Try to parse more complex date formats
  try {
    const dateResult = new Date(params);
    if (!isNaN(dateResult.getTime())) {
      return dateResult;
    }
  } catch (e) {
    // Parsing failed
  }
  
  return null;
};

// Helper function to extract time from voice command
export const extractTime = (params: string): string | null => {
  // Common time patterns in speech
  const timeRegex = /(\d{1,2})(:\d{2})?\s*(am|pm)?/i;
  const match = params.match(timeRegex);
  
  if (match) {
    let hour = parseInt(match[1]);
    const minutes = match[2] ? match[2].substring(1) : "00";
    const period = match[3] ? match[3].toLowerCase() : null;
    
    // Convert to 24-hour format
    if (period === "pm" && hour < 12) {
      hour += 12;
    } else if (period === "am" && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
  }
  
  return null;
};
