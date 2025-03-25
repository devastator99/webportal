
import { Languages } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface LanguageSelectorProps {
  sourceLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  sourceLanguage,
  onLanguageChange,
  disabled
}) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center space-x-1 text-sm">
        <Languages className="h-4 w-4 text-[#9b87f5]" />
        <span className="font-medium">Language:</span>
      </div>
      <Select 
        value={sourceLanguage} 
        onValueChange={onLanguageChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[150px] h-8 text-xs">
          <SelectValue placeholder="Select Language" />
        </SelectTrigger>
        <SelectContent>
          {INDIAN_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="text-xs">
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
