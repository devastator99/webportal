
import { useState, useEffect, useRef } from "react";
import { VoiceAgent } from "@/utils/VoiceAgent";
import { useToast } from "@/hooks/use-toast";

export interface UseVoiceRecognitionProps {
  onCommand: (command: string, params: string) => void;
  sourceLanguage: string;
}

export const useVoiceRecognition = ({ onCommand, sourceLanguage }: UseVoiceRecognitionProps) => {
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Click the microphone to start voice scheduling");
  const [isTranslating, setIsTranslating] = useState(false);
  const voiceAgentRef = useRef<VoiceAgent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    voiceAgentRef.current = new VoiceAgent(onCommand, setVoiceStatus, sourceLanguage);
    
    return () => {
      if (voiceAgentRef.current) {
        voiceAgentRef.current.stop();
      }
    };
  }, [sourceLanguage, onCommand]);

  const toggleListening = () => {
    if (listening) {
      voiceAgentRef.current?.stop();
      setListening(false);
    } else {
      voiceAgentRef.current?.start();
      setListening(true);
    }
  };

  const stopListening = () => {
    if (listening && voiceAgentRef.current) {
      voiceAgentRef.current.stop();
      setListening(false);
    }
  };

  return {
    listening,
    voiceStatus,
    isTranslating,
    setIsTranslating,
    toggleListening,
    stopListening
  };
};
