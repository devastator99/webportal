import { Button } from "@/components/ui/button";
import { User, Stethoscope, Apple } from "lucide-react";

interface TestLoginButtonsProps {
  onTestLogin: (userType: "patient" | "doctor" | "nutritionist") => Promise<void>;
  loading: boolean;
}

export const TestLoginButtons = ({ onTestLogin, loading }: TestLoginButtonsProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Button
        variant="outline"
        onClick={() => onTestLogin("patient")}
        disabled={loading}
        className="flex items-center justify-center gap-2"
      >
        <User className="h-4 w-4" />
        <span>Patient</span>
      </Button>
      <Button
        variant="outline"
        onClick={() => onTestLogin("doctor")}
        disabled={loading}
        className="flex items-center justify-center gap-2"
      >
        <Stethoscope className="h-4 w-4" />
        <span>Doctor</span>
      </Button>
      <Button
        variant="outline"
        onClick={() => onTestLogin("nutritionist")}
        disabled={loading}
        className="flex items-center justify-center gap-2"
      >
        <Apple className="h-4 w-4" />
        <span>Nutritionist</span>
      </Button>
    </div>
  );
};
