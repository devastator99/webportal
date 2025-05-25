
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LucideLoader2, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [sessionReady, setSessionReady] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(true);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Process authentication state on component mount
  useEffect(() => {
    const processAuthState = async () => {
      try {
        console.log('[UpdatePassword] Processing auth state...');
        console.log('[UpdatePassword] Current URL:', window.location.href);
        
        // Wait a moment for Supabase to process any auth tokens in the URL
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[UpdatePassword] Session error:', sessionError);
          setError('Failed to verify authentication. Please try requesting a new password reset link.');
          setProcessingAuth(false);
          return;
        }
        
        if (session) {
          console.log('[UpdatePassword] Valid session found, ready for password update');
          setSessionReady(true);
          setError(null);
        } else {
          console.error('[UpdatePassword] No valid session found');
          setError('Invalid or expired password reset link. Please request a new password reset link.');
        }
        
      } catch (err) {
        console.error('[UpdatePassword] Error processing auth state:', err);
        setError('An error occurred while processing your password reset request. Please try again.');
      } finally {
        setProcessingAuth(false);
      }
    };

    processAuthState();
  }, []);

  const onSubmit = async (values: z.infer<typeof updatePasswordSchema>) => {
    if (!sessionReady) {
      setError('Authentication session is not ready. Please try refreshing the page.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[UpdatePassword] Updating password...');
      
      const { error } = await supabase.auth.updateUser({ 
        password: values.password 
      });

      if (error) {
        console.error('[UpdatePassword] Error updating password:', error);
        setError(`Failed to update password: ${error.message}`);
        return;
      }

      console.log('[UpdatePassword] Password updated successfully');
      setSuccess(true);
      
      toast('Password updated successfully', {
        description: 'You can now log in with your new password',
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
      
    } catch (e: any) {
      console.error('[UpdatePassword] Exception updating password:', e);
      setError(`An unexpected error occurred: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (processingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-4">
                <LucideLoader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Processing your request...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we verify your password reset link</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <CardTitle className="flex items-center gap-2">
              {sessionReady ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Update Password
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Reset Link Invalid
                </>
              )}
            </CardTitle>
            <CardDescription>
              {sessionReady 
                ? 'Enter your new password below'
                : 'There was a problem with your password reset link'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success ? (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-green-600 mb-2 font-medium">Password updated successfully!</div>
                <div className="text-sm text-gray-500">Redirecting to login page...</div>
              </div>
            ) : sessionReady ? (
              <Form {...form}>
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
              </Form>
            ) : (
              <div className="text-center py-4">
                <div className="text-red-600 mb-4">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-medium">Invalid Reset Link</p>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  This password reset link is invalid or has expired. Please request a new password reset link.
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Request New Reset Link
                </Button>
              </div>
            )}
          </CardContent>
          
          {(sessionReady || success) && (
            <CardFooter className="flex justify-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-sm"
              >
                Back to Sign In
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UpdatePassword;
