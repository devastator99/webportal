
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const translateText = async (text: string, fromLanguage: string, toLanguage: string = "en"): Promise<string> => {
    try {
      setIsTranslating(true);
      
      if (fromLanguage === toLanguage) {
        return text;
      }
      
      console.log(`Translating from ${fromLanguage} to ${toLanguage}: "${text}"`);
      
      const { data, error } = await supabase.functions.invoke("bhashini-translate", {
        body: {
          sourceLanguage: fromLanguage,
          targetLanguage: toLanguage,
          text: text
        }
      });
      
      if (error) {
        console.error("Translation error:", error);
        throw error;
      }
      
      console.log("Translation response:", data);
      
      let translatedText = "";
      
      if (data.translation && data.translation.targetText) {
        translatedText = Array.isArray(data.translation.targetText) 
          ? data.translation.targetText.join(" ") 
          : data.translation.targetText;
      } else if (typeof data.translation === 'string') {
        translatedText = data.translation;
      } else {
        translatedText = JSON.stringify(data.translation);
      }
      
      console.log("Translated text:", translatedText);
      return translatedText;
      
    } catch (error) {
      console.error("Error in translateText:", error);
      toast({
        title: "Translation Error",
        description: "Failed to translate text. Using original input.",
        variant: "destructive"
      });
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    isTranslating,
    setIsTranslating,
    translateText
  };
};
