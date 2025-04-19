
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SupabaseAuthUI } from '@/components/auth/SupabaseAuthUI';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { getEnvironmentInfo } from '@/utils/environmentUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Password validation schema
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
  const [useCustomForm, setUseCustomForm] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  
  // Log environment info on mount for debugging
  useEffect(() => {
    const envInfo = getEnvironmentInfo();
    console.log("UpdatePasswordForm environment info:", envInfo);
    console.log("Current URL:", window.location.href);
    console.log("URL hash:", window.location.hash);
  }, []);
  
  // Check if the token in the URL is valid
  useEffect(() => {
    const checkResetToken = async () => {
      try {
        // Log the URL hash if present
        const urlHash = window.location.hash;
        if (urlHash) {
          console.log("URL hash detected:", urlHash);
        }
        
        // This will check if there's a valid hash for password reset in the URL
        const { data, error } = await supabase.auth.getUser();
        
        console.log("Password reset token check:", { data, error });
        
        if (error) {
          console.error("Invalid or expired password reset token:", error);
          setIsTokenValid(false);
          toast.error("Password reset link is invalid or has expired");
        } else {
          console.log("Valid password reset token detected");
          setIsTokenValid(true);
        }
      } catch (error) {
        console.error("Error checking reset token:", error);
        setIsTokenValid(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    // Check for recovery type in both search params and URL hash
    const isRecoveryInParams = searchParams.get('type') === 'recovery';
    const isRecoveryInHash = window.location.hash.includes('type=recovery');
    
    if (isRecoveryInParams || isRecoveryInHash) {
      console.log("Recovery mode detected, checking token");
      checkResetToken();
    } else {
      console.log("Not in recovery mode");
      setIsChecking(false);
    }
  }, [searchParams]);
  
  const onSubmit = async (data: PasswordFormValues) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      
      if (error) {
        console.error("Error updating password:", error);
        toast.error(error.message || "Failed to update password. Please try again.");
      } else {
        toast.success("Password updated successfully!");
        navigate('/auth');
      }
    } catch (error: any) {
      console.error("Unexpected error during password update:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isChecking) {
    return (
      <div className="space-y-4 text-center">
        <p>Verifying your password reset link...</p>
        <div className="flex justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  if (isTokenValid === false) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid or Expired Link</AlertTitle>
          <AlertDescription>
            Your password reset link is invalid or has expired. Please request a new password reset link.
          </AlertDescription>
        </Alert>
        
        <Button
          className="w-full"
          onClick={() => navigate("/auth?mode=reset")}
        >
          Request New Password Reset Link
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => navigate("/auth")}
        >
          Back to Login
        </Button>
      </div>
    );
  }
  
  if (useCustomForm) {
    return (
      <div className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-800">Set Your New Password</AlertTitle>
          <AlertDescription className="text-blue-700">
            Please create a new password for your account. Make sure it's at least 8 characters long.
          </AlertDescription>
        </Alert>
        
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
          </form>
        </Form>
        
        <div className="text-center mt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setUseCustomForm(false)}
          >
            Use Supabase Auth UI
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full mt-2"
            onClick={() => navigate("/auth")}
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }
  
  // Fallback to Supabase Auth UI if user prefers
  return (
    <div className="space-y-4">
      <SupabaseAuthUI 
        view="update_password" 
        onSuccess={() => {
          toast.success("Password updated successfully!");
          navigate('/auth');
        }}
      />
      
      <div className="text-center mt-4">
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setUseCustomForm(true)}
        >
          Use Custom Form
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          className="w-full mt-2"
          onClick={() => navigate("/auth")}
        >
          Back to Login
        </Button>
      </div>
    </div>
  );
};
