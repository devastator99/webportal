
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { LucideLoader2, Calendar as CalendarIcon } from "lucide-react";
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
import { formatDateFromDisplay, parseDateFromDisplay } from "@/utils/dateUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (email: string, password: string, userType?: string, firstName?: string, lastName?: string, patientData?: PatientData) => Promise<void>;
  error: string | null;
  loading: boolean;
}

const patientDataSchema = z.object({
  age: z.string().min(1, "Age is required"),
  gender: z.string().min(1, "Gender is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  allergies: z.string().optional(),
  emergencyContact: z.string().min(10, "Valid emergency contact is required").max(15),
  height: z.string().optional(),
  birthDate: z.string().optional(),
  foodHabit: z.string().optional(),
  knownAllergies: z.string().optional(),
  currentMedicalConditions: z.string().optional(),
});

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
  height: z.string().optional(),
  birthDate: z.string().optional(),
  foodHabit: z.string().optional(),
  knownAllergies: z.string().optional(),
  currentMedicalConditions: z.string().optional(),
});

const standardSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
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
  const { toast } = useToast();

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
      const { email, password, firstName, lastName } = data;
      
      if (type === "register" && userType === "patient") {
        const birthDateFormatted = data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : null;
        
        const patientData: PatientData = {
          age: data.age,
          gender: data.gender,
          bloodGroup: data.bloodGroup,
          allergies: data.allergies || "",
          emergencyContact: data.emergencyContact,
          height: data.height || undefined,
          birthDate: birthDateFormatted,
          foodHabit: data.foodHabit || undefined,
          knownAllergies: data.knownAllergies || undefined,
          currentMedicalConditions: data.currentMedicalConditions || undefined,
        };
        console.log("Submitting patient data:", patientData);
        await onSubmit(email, password, userType, firstName, lastName, patientData);
      } else {
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
            
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      disabled={loading}
                      onValueChange={(value: "patient" | "doctor" | "nutritionist") => {
                        field.onChange(value);
                        handleUserTypeChange(value);
                      }}
                      defaultValue={userType}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900">
                          <SelectValue placeholder="Select User Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nutritionist">Nutritionist</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      disabled={loading}
                      className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400 text-purple-900 placeholder:text-purple-400"
                      minLength={6}
                    />
                  </div>
                </FormControl>
                <div className="flex items-center space-x-2 mt-1">
                  <Checkbox 
                    id="showPassword" 
                    checked={showPassword} 
                    onCheckedChange={(checked) => setShowPassword(checked === true)}
                    className="border-purple-300"
                  />
                  <label 
                    htmlFor="showPassword" 
                    className="text-xs cursor-pointer text-purple-700"
                  >
                    Show password
                  </label>
                </div>
              </FormItem>
            )}
          />
        </motion.div>

        {showPatientFields && (
          <ScrollArea className="h-52 mt-4 rounded-md border border-purple-100 p-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-purple-800">Patient Information</h3>
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-purple-700">Age</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="Age"
                        disabled={loading}
                        className="bg-white/50 border-purple-200 focus:border-purple-400"
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
                    <FormLabel className="text-xs text-purple-700">Gender</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white/50 border-purple-200 focus:border-purple-400">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormLabel className="text-xs text-purple-700">Blood Group</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white/50 border-purple-200 focus:border-purple-400">
                          <SelectValue placeholder="Select Blood Group" />
                        </SelectTrigger>
                      </FormControl>
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
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-purple-700">Emergency Contact</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="Emergency Contact Number"
                        disabled={loading}
                        className="bg-white/50 border-purple-200 focus:border-purple-400"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs text-purple-700">Birth Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`pl-3 text-left font-normal bg-white/50 border-purple-200 focus:border-purple-400 ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? date.toISOString() : "")}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-purple-700">Height (cm)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="Height in cm"
                        disabled={loading}
                        className="bg-white/50 border-purple-200 focus:border-purple-400"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="foodHabit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-purple-700">Food Habits</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white/50 border-purple-200 focus:border-purple-400">
                          <SelectValue placeholder="Select Food Habits" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                        <SelectItem value="pescatarian">Pescatarian</SelectItem>
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
                    <FormLabel className="text-xs text-purple-700">Known Allergies</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="List any allergies (e.g., peanuts, shellfish)"
                        disabled={loading}
                        className="bg-white/50 border-purple-200 focus:border-purple-400 min-h-20"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentMedicalConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-purple-700">Current Medical Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="List any current medical conditions"
                        disabled={loading}
                        className="bg-white/50 border-purple-200 focus:border-purple-400 min-h-20"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </ScrollArea>
        )}
        
        {type === "login" && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              className="text-sm text-purple-600 hover:text-purple-500 w-full"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot password?
            </Button>
          </div>
        )}

        {type === "login" && (
          <div className="h-6">
            {/* Placeholder for spacing */}
          </div>
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

        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent>
            <ForgotPasswordForm onClose={() => setShowForgotPassword(false)} />
          </DialogContent>
        </Dialog>
      </motion.form>
    </Form>
  );
};
