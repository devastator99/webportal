import { Button } from "@/components/ui/button";

interface TestLoginButtonsProps {
  onTestLogin: (email: string, password: string) => Promise<void>;
  loading: boolean;
}

export const TestLoginButtons = ({ onTestLogin, loading }: TestLoginButtonsProps) => {
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
        onClick={() => onTestLogin("doctor@test.com", "test123")}
        disabled={loading}
      >
        Login as Test Doctor
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
        onClick={() => onTestLogin("patient@test.com", "test123")}
        disabled={loading}
      >
        Login as Test Patient
      </Button>
    </div>
  );
};