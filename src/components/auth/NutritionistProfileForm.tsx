
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, completeNutritionistRegistration } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LucideLoader2 } from "lucide-react";

const nutritionistProfileSchema = z.object({
  specialization: z.string()
    .min(2, "Specialization must be at least 2 characters")
    .max(100, "Specialization cannot exceed 100 characters")
    .trim(),
  certifications: z.string()
    .min(2, "Certifications must be at least 2 characters")
    .max(500, "Certifications description too long")
    .trim(),
  experience_years: z.string()
    .refine(val => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0 && num <= 50;
    }, {
      message: "Experience years must be a valid number between 0 and 50",
    }),
  consultation_fee: z.string()
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 10000;
    }, {
      message: "Consultation fee must be a valid number between 1 and 10,000",
    }),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 characters")
    .regex(/^[\+]?[0-9\s\-\(\)]{8,15}$/, "Please enter a valid phone number")
    .trim(),
});

type NutritionistProfileFormValues = z.infer<typeof nutritionistProfileSchema>;

export const NutritionistProfileForm = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<NutritionistProfileFormValues>({
    resolver: zodResolver(nutritionistProfileSchema),
    defaultValues: {
      specialization: "",
      certifications: "",
      experience_years: "0",
      consultation_fee: "300",
      phone: "",
    },
  });

  // Check if the nutritionist profile is already complete
  useEffect(() => {
    const checkProfile = async () => {
      if (!user || userRole !== "nutritionist") return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("specialty, consultation_fee, phone")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error checking nutritionist profile:", error);
          throw error;
        }

        // If all required fields are present, consider profile complete
        if (data?.specialty && data?.phone) {
          navigate("/dashboard");
        } else if (data) {
          // Pre-fill the form with any existing data
          form.reset({
            specialization: data.specialty || "",
            certifications: "",
            experience_years: "0",
            consultation_fee: data.consultation_fee ? data.consultation_fee.toString() : "300",
            phone: data.phone || "",
          });
        }
      } catch (error) {
        console.error("Error checking nutritionist profile:", error);
        toast({
          variant: "destructive",
          title: "Error loading profile",
          description: "Could not load existing profile data. Please try refreshing the page.",
        });
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [user, userRole, navigate, form, toast]);

  const onSubmit = async (values: NutritionistProfileFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "User session not found. Please log in again.",
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log("Starting nutritionist registration completion with values:", values);
      
      // Use the enhanced nutritionist registration function
      const registrationResult = await completeNutritionistRegistration(
        user.id,
        user.user_metadata?.first_name || "Nutritionist",
        user.user_metadata?.last_name || "User",
        values.phone.trim(),
        values.specialization.trim(),
        values.certifications.trim(),
        parseInt(values.experience_years, 10),
        parseFloat(values.consultation_fee)
      );

      console.log("Nutritionist registration completed successfully:", registrationResult);

      if (registrationResult && registrationResult.success) {
        toast({
          title: "Registration Complete",
          description: "Your nutritionist profile has been completed successfully. Welcome notifications will be sent automatically.",
        });

        // Trigger task processing to handle the registration tasks
        setTimeout(async () => {
          try {
            const { error: processError } = await supabase.functions.invoke(
              'process-registration-tasks',
              { body: { user_id: user.id } }
            );
            
            if (processError) {
              console.error("Failed to process registration tasks:", processError);
            } else {
              console.log("Registration tasks processing triggered successfully");
            }
          } catch (err) {
            console.error("Error triggering task processing:", err);
          }
        }, 2000);

        // Navigate to dashboard after successful registration
        navigate("/dashboard");
      } else {
        console.error("Nutritionist registration failed:", registrationResult);
        throw new Error(registrationResult?.error || "Registration failed with unknown error");
      }
      
    } catch (error: any) {
      console.error("Error completing nutritionist registration:", error);
      
      let errorMessage = "Something went wrong during registration. Please try again.";
      
      if (error.message?.includes("phone")) {
        errorMessage = "Invalid phone number. Please check the format and try again.";
      } else if (error.message?.includes("specialization")) {
        errorMessage = "Please provide a valid specialization.";
      } else if (error.message?.includes("consultation_fee")) {
        errorMessage = "Please provide a valid consultation fee amount.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // If user is not a nutritionist
  if (!user || userRole !== "nutritionist") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          Complete Your Nutritionist Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please provide your professional details to complete registration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+91 98765 43210" 
                        disabled={loading}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Clinical Nutrition, Sports Nutrition" 
                        disabled={loading}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Registered Dietitian, Certified Nutrition Specialist" 
                        disabled={loading}
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        max="50"
                        placeholder="e.g., 5" 
                        disabled={loading}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consultation_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultation Fee (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="10000"
                        step="1"
                        placeholder="e.g., 300" 
                        disabled={loading}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-white font-medium py-2 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing Registration...
                  </span>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};
