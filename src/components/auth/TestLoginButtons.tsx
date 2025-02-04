import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TestLoginButtonsProps {
  onTestLogin: (email: string, password: string) => Promise<void>;
  loading: boolean;
}

export const TestLoginButtons = ({ onTestLogin, loading }: TestLoginButtonsProps) => {
  const { toast } = useToast();

  const handleTestLogin = async (email: string, password: string) => {
    try {
      console.log(`Attempting test login for ${email}`);
      await onTestLogin(email, password);
    } catch (error: any) {
      console.error("Test login error:", error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: error.message || "Failed to login. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
        onClick={() => handleTestLogin("doctor@test.com", "test123")}
        disabled={loading}
      >
        Login as Test Doctor
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
        onClick={() => handleTestLogin("patient@test.com", "test123")}
        disabled={loading}
      >
        Login as Test Patient
      </Button>
    </div>
  );
};