
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Language {
  code: string;
  name: string;
}

const INDIAN_LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "as", name: "Assamese" },
  { code: "ur", name: "Urdu" },
];

export const LanguageTranslator = () => {
  const [sourceLanguage, setSourceLanguage] = useState<string>("en");
  const [targetLanguage, setTargetLanguage] = useState<string>("hi");
  const [inputText, setInputText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter some text to translate.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke("bhashini-translate", {
        body: {
          sourceLanguage,
          targetLanguage,
          text: inputText,
        },
      });

      if (error) {
        throw error;
      }

      // Handle the response based on Bhashini API structure
      if (data.translation && data.translation.targetText) {
        setTranslatedText(Array.isArray(data.translation.targetText) 
          ? data.translation.targetText.join(" ") 
          : data.translation.targetText);
      } else {
        setTranslatedText(JSON.stringify(data.translation));
      }

    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Failed",
        description: error.message || "Failed to translate text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    setInputText(translatedText);
    setTranslatedText("");
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-[#9b87f5] text-white">
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Indian Language Translator
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source Language" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={swapLanguages} 
            className="px-2"
            disabled={isLoading}
          >
            ↔️
          </Button>
          
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Target Language" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Input Text</label>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Enter text in ${INDIAN_LANGUAGES.find(l => l.code === sourceLanguage)?.name || sourceLanguage}`}
            className="min-h-[100px]"
          />
        </div>

        <Button 
          className="w-full bg-[#9b87f5] hover:bg-[#8a75e7]" 
          onClick={handleTranslate}
          disabled={isLoading || !inputText.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            "Translate"
          )}
        </Button>

        <div className="space-y-2">
          <label className="text-sm font-medium">Translated Text</label>
          <div className="border rounded-md p-4 min-h-[100px] bg-gray-50">
            {translatedText || (
              <span className="text-gray-400">
                Translation will appear here
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
