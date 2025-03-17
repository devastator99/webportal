
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

const doctorProfileSchema = z.object({
  specialty: z.string().min(2, "Specialty is required"),
  visiting_hours: z.string().min(2, "Visiting hours are required"),
  clinic_location: z.string().min(2, "Clinic location is required"),
  consultation_fee: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Consultation fee must be a valid number greater than 0",
  }),
});

type DoctorProfileFormValues = z.infer<typeof doctorProfileSchema>;

export const DoctorProfileForm = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  const form = useForm<DoctorProfileFormValues>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      specialty: "",
      visiting_hours: "",
      clinic_location: "",
      consultation_fee: "500", // Default consultation fee
    },
  });

  // Check if the doctor profile is already complete
  useEffect(() => {
    const checkProfile = async () => {
      if (!user || userRole !== "doctor") return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("specialty, visiting_hours, clinic_location, consultation_fee")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // If all required fields are present, consider profile complete
        if (data?.specialty && data?.visiting_hours && data?.clinic_location) {
          setProfileComplete(true);
          navigate("/dashboard");
        } else if (data) {
          // Pre-fill the form with any existing data
          form.reset({
            specialty: data.specialty || "",
            visiting_hours: data.visiting_hours || "",
            clinic_location: data.clinic_location || "",
            consultation_fee: data.consultation_fee?.toString() || "500",
          });
        }
      } catch (error) {
        console.error("Error checking doctor profile:", error);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [user, userRole, navigate, form]);

  const onSubmit = async (values: DoctorProfileFormValues) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          specialty: values.specialty,
          visiting_hours: values.visiting_hours,
          clinic_location: values.clinic_location,
          consultation_fee: parseFloat(values.consultation_fee),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your doctor profile has been successfully updated.",
      });
      
      // Redirect to dashboard after successful update
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // If user is not a doctor or profile is already complete
  if (!user || userRole !== "doctor") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          Complete Your Doctor Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please provide your professional details to help patients find you
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Endocrinology, Cardiology" 
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
                name="visiting_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visiting Hours</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Mon-Fri: 9AM-5PM, Sat: 9AM-1PM" 
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
                name="clinic_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Location</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Full address of your clinic" 
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
                    <FormLabel>Consultation Fee (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        placeholder="e.g., 500" 
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
                    Saving...
                  </span>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};
