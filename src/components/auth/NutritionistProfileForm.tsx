
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  specialization: z.string().min(2, "Specialization is required"),
  certifications: z.string().min(2, "Certifications are required"),
  experience_years: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Experience years must be a valid number",
  }),
  consultation_fee: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Consultation fee must be a valid number greater than 0",
  }),
  phone: z.string().min(10, "Phone number is required"),
});

type NutritionistProfileFormValues = z.infer<typeof nutritionistProfileSchema>;

export const NutritionistProfileForm = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  const form = useForm<NutritionistProfileFormValues>({
    resolver: zodResolver(nutritionistProfileSchema),
    defaultValues: {
      specialization: "",
      certifications: "",
      experience_years: "0",
      consultation_fee: "300", // Default consultation fee
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
          .select("specialization, certifications, experience_years, consultation_fee, phone")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // If all required fields are present, consider profile complete
        if (data?.specialization && data?.certifications && data?.phone) {
          setProfileComplete(true);
          navigate("/dashboard");
        } else if (data) {
          // Pre-fill the form with any existing data
          form.reset({
            specialization: data.specialization || "",
            certifications: data.certifications || "",
            experience_years: data.experience_years?.toString() || "0",
            consultation_fee: data.consultation_fee?.toString() || "300",
            phone: data.phone || "",
          });
        }
      } catch (error) {
        console.error("Error checking nutritionist profile:", error);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [user, userRole, navigate, form]);

  const onSubmit = async (values: NutritionistProfileFormValues) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update the profile with nutritionist-specific information
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          specialization: values.specialization,
          certifications: values.certifications,
          experience_years: parseInt(values.experience_years),
          consultation_fee: parseFloat(values.consultation_fee),
          phone: values.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Trigger professional registration completion
      console.log("Triggering professional registration completion for nutritionist:", user.id);
      
      const { data: registrationResult, error: registrationError } = await supabase.functions.invoke(
        'complete-professional-registration',
        {
          body: {
            user_id: user.id,
            phone: values.phone
          }
        }
      );

      if (registrationError) {
        console.error("Professional registration error:", registrationError);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated, but there was an issue with sending notifications.",
          variant: "default",
        });
      } else if (registrationResult && registrationResult.success) {
        console.log("Professional registration completed successfully:", registrationResult);
        toast({
          title: "Registration complete",
          description: "Your nutritionist profile has been completed and welcome notifications have been sent.",
        });
      } else {
        console.error("Professional registration failed:", registrationResult);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated, but there was an issue completing the registration process.",
          variant: "default",
        });
      }
      
      // Redirect to dashboard after successful update
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error updating nutritionist profile:", error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // If user is not a nutritionist or profile is already complete
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
