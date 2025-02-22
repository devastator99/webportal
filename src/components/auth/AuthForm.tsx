
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { LucideLoader2 } from "lucide-react";

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (email: string, password: string, userType?: string) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export const AuthForm = ({ type, onSubmit, error, loading }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"patient" | "doctor" | "nutritionist">("patient");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      if (type === "register") {
        await onSubmit(email, password, userType);
      } else {
        await onSubmit(email, password);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.form 
      initial="hidden"
      animate="visible"
      variants={formVariants}
      onSubmit={handleSubmit} 
      className="space-y-4"
    >
      {error && (
        <Alert variant="destructive" className="animate-shake">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.div variants={itemVariants}>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900 placeholder:text-purple-400"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900 placeholder:text-purple-400"
          minLength={6}
        />
      </motion.div>

      {type === "register" && (
        <motion.div variants={itemVariants}>
          <Select
            value={userType}
            onValueChange={(value: "patient" | "doctor" | "nutritionist") => setUserType(value)}
            disabled={loading}
          >
            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900">
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="nutritionist">Nutritionist</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-white font-medium py-2 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
              {type === "login" ? "Signing in..." : "Creating account..."}
            </span>
          ) : (
            type === "login" ? "Sign In" : "Sign Up"
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
};
