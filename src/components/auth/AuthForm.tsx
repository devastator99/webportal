import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { LucideLoader2, Calendar as CalendarIcon, Mail, Lock, Phone } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientData } from "@/hooks/useAuthHandlers";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateForDisplay, parseDateFromDisplay } from "@/utils/dateUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ForgotPasswordForm from "./ForgotPasswordForm";
import SmsOtpPasswordReset from "./SmsOtpPasswordReset";

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (email: string, password: string, userType?: string, firstName?: string, lastName?: string, patientData?: PatientData) => Promise<void>;
  error: string | null;
  loading: boolean;
}

const patientDataSchema = z.object({
  age: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContact: z.string().optional(),
  height: z.string().optional(),
  birthDate: z.string().optional(),
  foodHabit: z.string().optional(),
  knownAllergies: z.string().optional(),
  currentMedicalConditions: z.string().optional(),
});

const patientSignupSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userType: z.string(),
  age: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContact: z.string().optional(),
  height: z.string().optional(),
  birthDate: z.string().optional(),
  foodHabit: z.string().optional(),
  knownAllergies: z.string().optional(),
  currentMedicalConditions: z.string().optional(),
});

const standardSignupSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userType: z.string(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const AuthForm = ({ type, onSubmit, error, loading }: AuthFormProps) => {
  const [userType, setUserType] = useState<"patient" | "doctor" | "nutritionist">("patient");
  const [showPatientFields, setShowPatientFields] = useState(type === "register" && userType === "patient");
  const [dateInputValue, setDateInputValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSmsOtpReset, setShowSmsOtpReset] = useState(false);
  const { toast } = useToast();

  const activeSchema = type === "login" 
    ? loginSchema 
    : (userType === "patient" ? patientSignupSchema : standardSignupSchema);

  const form = useForm({
    resolver: zodResolver(activeSchema),
    defaultValues: {
      email: "",
      phone: "",
      password: "",
      firstName: "",
      lastName: "",
      userType: "patient",
      age: "",
      gender: "",
      bloodGroup: "",
      allergies: "",
      emergencyContact: "",
      height: "",
      birthDate: "",
      foodHabit: "",
      knownAllergies: "",
      currentMedicalConditions: "",
    },
    mode: "onChange",
  });

  const handleUserTypeChange = (value: "patient" | "doctor" | "nutritionist") => {
    setUserType(value);
    form.setValue("userType", value);
    setShowPatientFields(value === "patient" && type === "register");
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInputValue(value);
    
    if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parsedDate = parseDateFromDisplay(value);
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        if (parsedDate < new Date() && parsedDate > new Date("1900-01-01")) {
          console.log("Manual date entered:", parsedDate);
          form.setValue("birthDate", parsedDate.toISOString());
        }
      }
    }
  };

  const handleSubmit = async (data: any) => {
    console.log("Form submitted with data:", data);
    if (loading) return;

    try {
      const { email, phone, password, firstName, lastName } = data;
      
      if (type === "register") {
        if (!userType) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please select a user type"
          });
          return;
        }

        if (!firstName || !lastName || !phone) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill in all required fields"
          });
          return;
        }
      }

      if (type === "register" && userType === "patient") {
        const birthDateFormatted = data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : null;
        
        const patientData: PatientData = {
          age: data.age || undefined,
          gender: data.gender || undefined,
          bloodGroup: data.bloodGroup || undefined,
          allergies: data.allergies || "",
          emergencyContact: data.emergencyContact || undefined,
          height: data.height || undefined,
          birthDate: birthDateFormatted,
          foodHabit: data.foodHabit || undefined,
          knownAllergies: data.knownAllergies || undefined,
          currentMedicalConditions: data.currentMedicalConditions || undefined,
        };
        console.log("Submitting patient data:", patientData);
        await onSubmit(email || phone, password, userType, firstName, lastName, patientData);
      } else {
        if (type === "register") {
          await onSubmit(email || phone, password, userType, firstName, lastName);
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
        className="space-y-6"
      >
        {error && (
          <Alert variant="destructive" className="bg-red-100 border-red-200 text-red-600">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {type === "register" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="space-y-1">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600 font-medium">First Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John"
                        disabled={loading}
                        className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600 font-medium">Last Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Doe"
                        disabled={loading}
                        className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="md:col-span-2">
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600 font-medium">I am a</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={(value: "patient" | "doctor" | "nutritionist") => {
                        field.onChange(value);
                        handleUserTypeChange(value);
                      }}
                      defaultValue={userType}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500">
                          <SelectValue placeholder="Select User Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        <SelectItem value="patient" className="hover:bg-purple-50">Patient</SelectItem>
                        <SelectItem value="doctor" className="hover:bg-purple-50">Doctor</SelectItem>
                        <SelectItem value="nutritionist" className="hover:bg-purple-50">Nutritionist</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </motion.div>
          </div>
        )}

        <motion.div variants={itemVariants} className="space-y-1">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-600 font-medium">
                  Phone Number {type === "register" && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+1 234 567 890"
                    disabled={loading}
                    className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </motion.div>

        {type === "login" && (
          <motion.div variants={itemVariants} className="space-y-1">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-600 font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="john@example.com"
                      disabled={loading}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </motion.div>
        )}

        {type === "register" && (
          <motion.div variants={itemVariants} className="space-y-1">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-600 font-medium">Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="john@example.com"
                      disabled={loading}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="space-y-1">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-600 font-medium">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={loading}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </FormControl>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showPassword" 
                      checked={showPassword} 
                      onCheckedChange={(checked) => setShowPassword(checked === true)}
                      className="border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label 
                      htmlFor="showPassword" 
                      className="text-sm text-gray-500"
                    >
                      Show password
                    </label>
                  </div>
                  {type === "login" && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Forgot password?
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSmsOtpReset(true)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Reset via SMS
                      </button>
                    </div>
                  )}
                </div>
              </FormItem>
            )}
          />
        </motion.div>

        {type === "register" && userType === "patient" && (
          <div className="bg-gray-50 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-600 font-medium">Age (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="28"
                          disabled={loading}
                          className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-600 font-medium">Gender (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                          <SelectItem value="male" className="hover:bg-purple-50">Male</SelectItem>
                          <SelectItem value="female" className="hover:bg-purple-50">Female</SelectItem>
                          <SelectItem value="other" className="hover:bg-purple-50">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-600 font-medium">Blood Group (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500">
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(group => (
                            <SelectItem key={group} value={group} className="hover:bg-purple-50">
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-600 font-medium">Emergency Contact (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="+1 234 567 890"
                          disabled={loading}
                          className="rounded-lg border-gray-200 focus:ring-2 focus:ring-purple-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </motion.div>
            </div>
          </div>
        )}

        <motion.div variants={itemVariants}>
          <Button 
            type="submit" 
            className="w-full h-12 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
            disabled={loading || !form.formState.isValid}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <LucideLoader2 className="mr-2 h-5 w-5 animate-spin" />
                {type === "login" ? "Signing in..." : "Creating account..."}
              </span>
            ) : (
              type === "login" ? "Sign In" : "Create Account"
            )}
          </Button>
        </motion.div>

        {/* Show additional forgot password link after login errors */}
        {type === "login" && error && (
          <motion.div variants={itemVariants} className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium underline block"
            >
              Forgot your password? Reset it here
            </button>
            <button
              type="button"
              onClick={() => setShowSmsOtpReset(true)}
              className="text-sm text-gray-500 hover:text-gray-700 underline block"
            >
              Or reset via SMS
            </button>
          </motion.div>
        )}
      </motion.form>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="auth-glass" hideCloseButton={true}>
          <DialogTitle className="sr-only">Reset Password</DialogTitle>
          <DialogDescription className="sr-only">
            Enter your email address to receive a password reset link
          </DialogDescription>
          <ForgotPasswordForm 
            open={showForgotPassword}
            onClose={() => setShowForgotPassword(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showSmsOtpReset} onOpenChange={setShowSmsOtpReset}>
        <DialogContent className="auth-glass" hideCloseButton={true}>
          <DialogTitle className="sr-only">Reset Password via SMS</DialogTitle>
          <DialogDescription className="sr-only">
            Enter your phone number to receive an OTP for password reset
          </DialogDescription>
          <SmsOtpPasswordReset 
            open={showSmsOtpReset}
            onClose={() => setShowSmsOtpReset(false)}
          />
        </DialogContent>
      </Dialog>
    </Form>
  );
};
