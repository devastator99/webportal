
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicrophoneButtonProps {
  listening: boolean;
  onClick: () => void;
  disabled: boolean;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  listening,
  onClick,
  disabled
}) => {
  return (
    <div className="flex justify-center">
      <Button
        size="sm"
        className={`rounded-full p-4 ${
          listening ? "bg-red-500 hover:bg-red-600" : "bg-[#9b87f5] hover:bg-[#8a75e7]"
        }`}
        onClick={onClick}
        disabled={disabled}
      >
        {listening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};
