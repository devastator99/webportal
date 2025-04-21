
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LucideLoader2 } from 'lucide-react';
import { toast } from 'sonner';

const updatePasswordSchema = z.object({
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be less than 72 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const UpdatePassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenProcessed, setTokenProcessed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Extract and process all possible recovery token formats
  useEffect(() => {
    const processRecoveryFlow = async () => {
      if (tokenProcessed) return;
      
      setLoading(true);
      setError(null);
      console.log("Processing recovery flow, pathname:", location.pathname);
      console.log("URL search params:", location.search);
      console.log("URL hash:", location.hash);
      
      try {
        // Check for token in query parameters (standard format)
        const queryParams = new URLSearchParams(location.search);
        const queryToken = queryParams.get('token');
        const queryType = queryParams.get('type');
        
        // Check for token in hash parameters (Supabase format)
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const hashToken = hashParams.get('token');
        const hashAccessToken = hashParams.get('access_token');
        const hashType = hashParams.get('type');
        
        console.log("Token info:", { 
          queryToken: queryToken ? "exists" : "missing", 
          queryType,
          hashToken: hashToken ? "exists" : "missing",
          hashAccessToken: hashAccessToken ? "exists" : "missing",
          hashType
        });
        
        // Case 1: We have a recovery token in the query parameters
        if (queryToken && queryType === 'recovery') {
          console.log("Processing recovery token from query parameters");
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: queryToken,
            type: 'recovery',
          });
          
          if (error) {
            console.error("Error verifying OTP:", error);
            setError(`Password reset link is invalid or has expired. Please request a new one. (Error: ${error.message})`);
          } else {
            console.log("OTP verification successful:", data);
            setTokenProcessed(true);
          }
        }
        // Case 2: We have a hash token (sometimes Supabase sends this format)
        else if (hashToken && hashType === 'recovery') {
          console.log("Processing recovery token from hash parameters");
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: hashToken,
            type: 'recovery',
          });
          
          if (error) {
            console.error("Error verifying hash token:", error);
            setError(`Password reset link is invalid or has expired. Please request a new one. (Error: ${error.message})`);
          } else {
            console.log("Hash token verification successful:", data);
            setTokenProcessed(true);
          }
        }
        // Case 3: We have an access token in the hash (this is the most common Supabase format)
        else if (hashAccessToken && hashType === 'recovery') {
          console.log("Processing access token from hash parameters");
          try {
            // Set the session with the provided access token
            const { data, error } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: '', // We don't have a refresh token in this flow
            });
            
            if (error) {
              console.error("Error setting session:", error);
              setError(`Unable to verify your session. Please request a new reset link. (Error: ${error.message})`);
            } else {
              console.log("Session set successfully:", data);
              setTokenProcessed(true);
            }
          } catch (error: any) {
            console.error("Exception in setSession:", error);
            setError(`Error processing your session: ${error.message}`);
          }
        }
        // Case 4: Check if user is already authenticated
        else {
          console.log("No token found, checking if user is already authenticated");
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log("User already has a valid session:", session);
            setTokenProcessed(true);
          } else {
            console.error("No valid token or session found");
            setError("Invalid or missing password reset link. Please request a new password reset link.");
          }
        }
      } catch (error: any) {
        console.error("Exception in processRecoveryFlow:", error);
        setError(`An error occurred while processing your password reset link: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    processRecoveryFlow();
  }, [location, tokenProcessed]);

  const onSubmit = async (values: z.infer<typeof updatePasswordSchema>) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Updating password");
      const { error } = await supabase.auth.updateUser({ 
        password: values.password 
      });

      if (error) {
        console.error("Error updating password:", error);
        setError(`Failed to update password: ${error.message}`);
      } else {
        console.log("Password updated successfully");
        setSuccess(true);
        toast('Password updated successfully', {
          description: 'You can now log in with your new password',
        });
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } catch (e: any) {
      console.error("Exception in update password:", e);
      setError(`An unexpected error occurred: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          Reset Your Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {loading && !tokenProcessed ? (
              <div className="flex flex-col items-center justify-center py-4">
                <LucideLoader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="mt-2 text-sm text-gray-500">Verifying your reset link...</p>
              </div>
            ) : success ? (
              <div className="text-center py-4">
                <div className="text-green-600 mb-2">Password updated successfully!</div>
                <div className="text-sm text-gray-500">Redirecting to login page...</div>
              </div>
            ) : (
              <Form {...form}>
                {tokenProcessed ? (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter new password" 
                              {...field}
                              disabled={loading} 
                            />
                          </FormControl>
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
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm new password" 
                              {...field}
                              disabled={loading} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-red-600 mb-2">Invalid or expired password reset link</div>
                    <div className="text-sm text-gray-500">Please request a new password reset link</div>
                  </div>
                )}
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-sm"
            >
              Back to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default UpdatePassword;
