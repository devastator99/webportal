import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  return (
    <div className="space-y-2">
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={buttonVariants}
      >
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white/50 backdrop-blur-sm border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-300 transition-all duration-300"
          onClick={() => handleTestLogin("doctor@test.com", "test123")}
          disabled={loading}
        >
          Login as Test Doctor
        </Button>
      </motion.div>
      
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={buttonVariants}
      >
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white/50 backdrop-blur-sm border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-300 transition-all duration-300"
          onClick={() => handleTestLogin("patient@test.com", "test123")}
          disabled={loading}
        >
          Login as Test Patient
        </Button>
      </motion.div>
    </div>
  );
};