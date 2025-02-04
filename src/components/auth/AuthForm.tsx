import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "register") {
      await onSubmit(email, password, userType);
    } else {
      await onSubmit(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="text-[#6E59A5]"
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="text-[#6E59A5]"
          minLength={6}
        />
      </div>
      {type === "register" && (
        <div>
          <Select
            value={userType}
            onValueChange={(value: "patient" | "doctor" | "nutritionist") => setUserType(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="nutritionist">Nutritionist</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button 
        type="submit" 
        className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]" 
        disabled={loading}
      >
        {loading ? `${type === "login" ? "Signing in..." : "Signing up..."}` : 
          `${type === "login" ? "Sign In" : "Sign Up"}`}
      </Button>
    </form>
  );
};