
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { LucideLoader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (email: string, password: string, userType?: string, firstName?: string, lastName?: string, patientData?: any) => Promise<void>;
  error: string | null;
  loading: boolean;
}

// Schema for patient-specific data
const patientDataSchema = z.object({
  age: z.string().min(1, "Age is required"),
  gender: z.string().min(1, "Gender is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  allergies: z.string().optional(),
  emergencyContact: z.string().min(10, "Valid emergency contact is required").max(15),
});

// For patient signup validation
const patientSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userType: z.string(),
  age: z.string().min(1, "Age is required"),
  gender: z.string().min(1, "Gender is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  allergies: z.string().optional(),
  emergencyContact: z.string().min(10, "Valid emergency contact is required").max(15),
});

// For other user types
const standardSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userType: z.string(),
});

// For login
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const AuthForm = ({ type, onSubmit, error, loading }: AuthFormProps) => {
  const [userType, setUserType] = useState<"patient" | "doctor" | "nutritionist">("patient");
  const [showPatientFields, setShowPatientFields] = useState(false);
  const { toast } = useToast();

  // Determine which schema to use
  const activeSchema = type === "login" 
    ? loginSchema 
    : (userType === "patient" ? patientSignupSchema : standardSignupSchema);

  const form = useForm({
    resolver: zodResolver(activeSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      userType: "patient",
      age: "",
      gender: "",
      bloodGroup: "",
      allergies: "",
      emergencyContact: "",
    },
  });

  const handleUserTypeChange = (value: "patient" | "doctor" | "nutritionist") => {
    setUserType(value);
    form.setValue("userType", value);
    setShowPatientFields(value === "patient" && type === "register");
  };

  const handleSubmit = async (data: any) => {
    if (loading) return;

    try {
      const { email, password, firstName, lastName } = data;
      
      // If it's patient registration, collect the patient-specific data
      if (type === "register" && userType === "patient") {
        const patientData = {
          age: data.age,
          gender: data.gender,
          bloodGroup: data.bloodGroup,
          allergies: data.allergies || "",
          emergencyContact: data.emergencyContact,
        };
        await onSubmit(email, password, userType, firstName, lastName, patientData);
      } else {
        // For login or non-patient registration
        if (type === "register") {
          await onSubmit(email, password, userType, firstName, lastName);
        } else {
          await onSubmit(email, password);
        }
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
    <Form {...form}>
      <motion.form 
        initial="hidden"
        animate="visible"
        variants={formVariants}
        onSubmit={form.handleSubmit(handleSubmit)} 
        className="space-y-4"
      >
        {error && (
          <Alert variant="destructive" className="animate-shake">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {type === "register" && (
          <>
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="First Name"
                        disabled={loading}
                        className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900 placeholder:text-purple-400"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Last Name"
                        disabled={loading}
                        className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900 placeholder:text-purple-400"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </motion.div>
          </>
        )}

        <motion.div variants={itemVariants}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Email"
                    disabled={loading}
                    className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900 placeholder:text-purple-400"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Password"
                    disabled={loading}
                    className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900 placeholder:text-purple-400"
                    minLength={6}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </motion.div>

        {type === "register" && (
          <motion.div variants={itemVariants}>
            <Select
              value={userType}
              onValueChange={(value: "patient" | "doctor" | "nutritionist") => handleUserTypeChange(value)}
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

        {/* Patient-specific fields */}
        {showPatientFields && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 pt-2 border-t border-purple-200"
          >
            <h3 className="text-sm font-medium text-purple-800">Patient Information</h3>
            
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Age"
                      disabled={loading}
                      className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900 placeholder:text-purple-400"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloodGroup"
              render={({ field }) => (
                <FormItem>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900">
                      <SelectValue placeholder="Blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Allergies (if any)"
                      disabled={loading}
                      className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900 placeholder:text-purple-400"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Emergency Contact Number"
                      disabled={loading}
                      className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900 placeholder:text-purple-400"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
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
    </Form>
  );
};
