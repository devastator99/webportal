
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const UpdatePasswordForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { handleUpdatePassword, loading: isSubmitting } = useAuthHandlers();
  const [sessionVerified, setSessionVerified] = useState(false);
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const verifySession = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log("Current session during password reset:", data?.session ? "Active session" : "No session");
      
      if (error) {
        console.error("Error checking session for password reset:", error);
        toast.error("Unable to verify your session. Please try the reset link again.");
      } else if (!data?.session) {
        console.log("No active session for password reset");
        // Check URL parameters for token
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        
        if (token && type === 'recovery') {
          console.log("Found recovery token in URL, trying to verify");
          try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery'
            });
            
            if (verifyError) {
              console.error("Error verifying token:", verifyError);
              toast.error("Password reset token is invalid or expired");
              navigate('/auth');
            } else {
              setSessionVerified(true);
              toast.success("Recovery verified. Please set your new password.");
            }
          } catch (e) {
            console.error("Exception verifying token:", e);
            toast.error("Failed to process reset token");
            navigate('/auth');
          }
        } else {
          toast.error("No valid reset session found");
          navigate('/auth');
        }
      } else {
        setSessionVerified(true);
      }
    };
    
    verifySession();
  }, [navigate]);

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      console.log("Submitting password update");
      const success = await handleUpdatePassword(data.password);
      if (success) {
        toast.success("Password updated successfully!");
        navigate('/auth');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || "Failed to update password");
    }
  };

  if (!sessionVerified && isSubmitting) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
        <span className="ml-3">Verifying session...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter new password" 
                    {...field} 
                  />
                </FormControl>
                <button 
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirm your password" 
                    {...field} 
                  />
                </FormControl>
                <button 
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full mt-6" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">Updating Password</span>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
            </>
          ) : "Update Password"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => navigate("/auth")}
        >
          Back to Login
        </Button>
      </form>
    </Form>
  );
};
