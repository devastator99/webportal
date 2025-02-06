import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMockPayment } from "@/utils/mockPayment";
import { useToast } from "@/hooks/use-toast";

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (email: string, password: string, userType?: string, firstName?: string, lastName?: string) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export const AuthForm = ({ type, onSubmit, error, loading }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState<"patient" | "doctor" | "nutritionist">("patient");
  const [processingPayment, setProcessingPayment] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || processingPayment) return;
    
    try {
      if (type === "register") {
        // For doctors, process payment first
        if (userType === "doctor") {
          setProcessingPayment(true);
          try {
            const paymentResult = await createMockPayment(5000); // ₹5000 registration fee
            toast({
              title: "Payment successful",
              description: `Payment ID: ${paymentResult.razorpay_payment_id}`,
            });
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Payment failed",
              description: "Unable to process payment. Please try again.",
            });
            return;
          } finally {
            setProcessingPayment(false);
          }
        }
        await onSubmit(email, password, userType, firstName, lastName);
      } else {
        await onSubmit(email, password);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {type === "register" && (
        <>
          <div>
            <Input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={loading || processingPayment}
              className="text-[#6E59A5]"
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={loading || processingPayment}
              className="text-[#6E59A5]"
            />
          </div>
        </>
      )}
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || processingPayment}
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
          disabled={loading || processingPayment}
          className="text-[#6E59A5]"
          minLength={6}
        />
      </div>
      {type === "register" && (
        <div>
          <Select
            value={userType}
            onValueChange={(value: "patient" | "doctor" | "nutritionist") => setUserType(value)}
            disabled={loading || processingPayment}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="doctor">Doctor (₹5000 registration fee)</SelectItem>
              <SelectItem value="nutritionist">Nutritionist</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button 
        type="submit" 
        className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]" 
        disabled={loading || processingPayment}
      >
        {loading || processingPayment ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {type === "login" ? "Signing in..." : 
             processingPayment ? "Processing payment..." : "Creating account..."}
          </span>
        ) : (
          type === "login" ? "Sign In" : "Sign Up"
        )}
      </Button>
    </form>
  );
};