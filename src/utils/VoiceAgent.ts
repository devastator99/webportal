
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

// Hindi commands
const hindiCommands = {
  START_SCHEDULING: ["अपॉइंटमेंट शेड्यूल करें", "नया अपॉइंटमेंट", "अपॉइंटमेंट बनाएं"],
  SELECT_PATIENT: ["मरीज़ चुनें", "रोगी चुनें", "पेशेंट"],
  SELECT_DATE: ["तारीख चुनें", "दिनांक", "तारीख"],
  SELECT_TIME: ["समय चुनें", "टाइम सेट करें", "समय"],
  CONFIRM: ["पुष्टि करें", "कन्फर्म", "सुनिश्चित करें"],
  CANCEL: ["रद्द करें", "रोकें", "कैंसिल"],
};

// Bengali commands
const bengaliCommands = {
  START_SCHEDULING: ["অ্যাপয়েন্টমেন্ট শিডিউল", "নতুন অ্যাপয়েন্টমেন্ট"],
  SELECT_PATIENT: ["রোগী নির্বাচন করুন", "রোগী বেছে নিন"],
  SELECT_DATE: ["তারিখ নির্বাচন করুন", "তারিখ বেছে নিন"],
  SELECT_TIME: ["সময় নির্বাচন করুন", "সময় বেছে নিন"],
  CONFIRM: ["নিশ্চিত করুন", "বুক করুন"],
  CANCEL: ["বাতিল করুন", "থামুন"],
};

// Tamil commands
const tamilCommands = {
  START_SCHEDULING: ["அப்பாய்ண்ட்மென்ட் திட்டமிடு", "புதிய அப்பாய்ண்ட்மென்ட்"],
  SELECT_PATIENT: ["நோயாளியைத் தேர்ந்தெடு", "நோயாளி"],
  SELECT_DATE: ["தேதியைத் தேர்ந்தெடு", "தேதி"],
  SELECT_TIME: ["நேரத்தைத் தேர்ந்தெடு", "நேரம்"],
  CONFIRM: ["உறுதிப்படுத்து", "உறுதி செய்"],
  CANCEL: ["ரத்து செய்", "நிறுத்து"],
};

// Telugu commands
const teluguCommands = {
  START_SCHEDULING: ["అపాయింట్మెంట్ షెడ్యూల్", "కొత్త అపాయింట్మెంట్"],
  SELECT_PATIENT: ["పేషెంట్ ఎంచుకోండి", "రోగి ఎంచుకోండి"],
  SELECT_DATE: ["తేదీ ఎంచుకోండి", "తేదీ"],
  SELECT_TIME: ["సమయం ఎంచుకోండి", "సమయం"],
  CONFIRM: ["నిర్ధారించండి", "బుక్ చేయండి"],
  CANCEL: ["రద్దు చేయండి", "ఆపండి"],
};

// Map language codes to command sets
const languageCommandsMap: Record<string, typeof schedulingCommands> = {
  en: schedulingCommands,
  hi: hindiCommands,
  bn: bengaliCommands,
  ta: tamilCommands,
  te: teluguCommands,
  // Add more languages as needed
};

export class VoiceAgent {
  private recognition: any;
  private isListening: boolean = false;
  private commandCallback: (command: string, params: string) => void;
  private statusCallback: (status: string) => void;
  private language: string;
  
  constructor(
    commandCallback: (command: string, params: string) => void,
    statusCallback: (status: string) => void,
    language: string = "en"
  ) {
    this.commandCallback = commandCallback;
    this.statusCallback = statusCallback;
    this.language = language;
    
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.statusCallback("Speech recognition not supported in this browser");
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    
    // Set language for speech recognition
    this.setRecognitionLanguage(language);
    
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
  
  private setRecognitionLanguage(language: string): void {
    // Map language codes to speech recognition language codes
    const langMap: Record<string, string> = {
      en: "en-US",
      hi: "hi-IN",
      bn: "bn-IN",
      ta: "ta-IN",
      te: "te-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      kn: "kn-IN",
      ml: "ml-IN",
      pa: "pa-IN",
      or: "or-IN",
      as: "as-IN",
      ur: "ur-IN"
    };
    
    // Set the language for recognition
    this.recognition.lang = langMap[language] || "en-US";
    console.log(`Speech recognition language set to: ${this.recognition.lang}`);
  }
  
  private processCommand(transcript: string): void {
    // Get the command set for the current language
    const commands = languageCommandsMap[this.language] || schedulingCommands;
    
    // Check for command matches
    for (const [commandType, phrases] of Object.entries(commands)) {
      for (const phrase of phrases) {
        if (transcript.includes(phrase)) {
          const params = transcript.replace(phrase, "").trim();
          this.commandCallback(commandType, params);
          return;
        }
      }
    }
    
    // If no specific command was matched in the current language, 
    // try with English commands as a fallback
    if (this.language !== "en") {
      for (const [commandType, phrases] of Object.entries(schedulingCommands)) {
        for (const phrase of phrases) {
          if (transcript.includes(phrase)) {
            const params = transcript.replace(phrase, "").trim();
            this.commandCallback(commandType, params);
            return;
          }
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
  const paramsLower = params.toLowerCase().trim();
  console.log("Extracting date from:", paramsLower);
  
  // Check for common date formats in speech
  const today = new Date();
  const currentYear = today.getFullYear();
  
  if (paramsLower.includes("today")) {
    return today;
  }
  
  if (paramsLower.includes("tomorrow")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  }
  
  if (paramsLower.includes("next week")) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek;
  }

  // Day of week handling
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (paramsLower.includes(daysOfWeek[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      const daysToAdd = (targetDay + 7 - currentDay) % 7 || 7; // If today, go to next week
      
      const dateForDay = new Date(today);
      dateForDay.setDate(today.getDate() + daysToAdd);
      return dateForDay;
    }
  }
  
  // Month and day pattern (e.g., "January 15" or "15th of January")
  const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  
  // First, check for "Month Day" format (e.g., "March 7th")
  for (let i = 0; i < monthNames.length; i++) {
    if (paramsLower.includes(monthNames[i])) {
      const month = i;
      
      // Try to extract the day number with ordinal
      const dayMatch = paramsLower.match(/\b(\d{1,2})(st|nd|rd|th)?\b/);
      if (dayMatch) {
        const day = parseInt(dayMatch[1], 10);
        if (day >= 1 && day <= 31) {
          const date = new Date(currentYear, month, day);
          
          // If this date is in the past, assume next year
          if (date < today) {
            date.setFullYear(currentYear + 1);
          }
          
          console.log(`Matched "Month Day" format: ${monthNames[i]} ${day} -> ${date.toISOString()}`);
          return date;
        }
      }
    }
  }
  
  // Then, check for "Day Month" format (e.g., "7th March")
  const ordinalDatePattern = /\b(\d{1,2})(st|nd|rd|th)?\s+(of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
  const ordinalMatch = paramsLower.match(ordinalDatePattern);
  if (ordinalMatch) {
    const day = parseInt(ordinalMatch[1], 10);
    const monthName = ordinalMatch[4].toLowerCase();
    const month = monthNames.indexOf(monthName);
    
    if (month !== -1 && day >= 1 && day <= 31) {
      const date = new Date(currentYear, month, day);
      
      // If this date is in the past, assume next year
      if (date < today) {
        date.setFullYear(currentYear + 1);
      }
      
      console.log(`Matched "Day Month" format: ${day} ${monthNames[month]} -> ${date.toISOString()}`);
      return date;
    }
  }
  
  // Try for MM/DD format
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})/;
  const match = paramsLower.match(datePattern);
  if (match) {
    // Check if first number is month or day based on US convention (MM/DD)
    const firstNum = parseInt(match[1], 10);
    const secondNum = parseInt(match[2], 10);
    
    let month, day;
    
    // Assume MM/DD format if first number could be a month
    if (firstNum >= 1 && firstNum <= 12) {
      month = firstNum - 1; // JavaScript months are 0-based
      day = secondNum;
    } else {
      return null; // Invalid date format
    }
    
    if (day >= 1 && day <= 31) {
      const date = new Date(currentYear, month, day);
      
      // If this date is in the past, assume next year
      if (date < today) {
        date.setFullYear(currentYear + 1);
      }
      
      console.log(`Matched MM/DD format: ${month+1}/${day} -> ${date.toISOString()}`);
      return date;
    }
  }
  
  // Try to parse more complex date formats
  try {
    const dateResult = new Date(paramsLower);
    if (!isNaN(dateResult.getTime())) {
      // If the date is valid but in the past, set it to next year
      if (dateResult < today && !paramsLower.includes(currentYear.toString())) {
        dateResult.setFullYear(currentYear + 1);
      }
      console.log(`Parsed with Date constructor: ${paramsLower} -> ${dateResult.toISOString()}`);
      return dateResult;
    }
  } catch (e) {
    // Parsing failed
    console.log("Date parsing failed with Date constructor:", e);
  }
  
  console.log("No date pattern matched for:", paramsLower);
  return null;
};

// Helper function to extract time from voice command
export const extractTime = (params: string): string | null => {
  const paramsLower = params.toLowerCase().trim();
  console.log("Extracting time from:", paramsLower);
  
  // Common time patterns in speech
  // Handle formats like "2:00 p.m.", "2 PM", "14:30"
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i;
  const match = paramsLower.match(timeRegex);
  
  if (match) {
    let hour = parseInt(match[1], 10);
    const minutes = match[2] ? match[2] : "00";
    const periodMatch = match[3] ? match[3].toLowerCase() : null;
    
    // Normalize period (am/pm)
    let period = null;
    if (periodMatch) {
      if (periodMatch.includes("p")) {
        period = "pm";
      } else if (periodMatch.includes("a")) {
        period = "am";
      }
    } else {
      // If no AM/PM specified and hour is small, assume standard business hours (9am-5pm)
      if (hour >= 1 && hour <= 7) {
        period = "pm"; // Assume afternoon for small numbers without am/pm
      } else if (hour >= 8 && hour <= 12) {
        period = "am"; // Assume morning for hours 8-12 without am/pm
      }
    }
    
    // Convert to 24-hour format
    if (period === "pm" && hour < 12) {
      hour += 12;
    } else if (period === "am" && hour === 12) {
      hour = 0;
    }
    
    const result = `${hour.toString().padStart(2, "0")}:${minutes}`;
    console.log(`Extracted time: ${paramsLower} -> ${result}`);
    return result;
  }
  
  console.log("No time pattern matched for:", paramsLower);
  return null;
};
