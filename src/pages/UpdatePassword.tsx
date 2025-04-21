
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
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Extract the access token and type from URL hash on component mount
  useEffect(() => {
    // First check if there's a hash in the URL (comes from Supabase password reset)
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (!accessToken || type !== 'recovery') {
      console.error('Missing or invalid recovery token', { accessToken, type });
      setError('Invalid or expired password reset link. Please request a new one.');
    } else {
      console.log('Valid recovery token found in URL');
      // Set the access token in the session to be used for updating password
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session:', error);
          setError('Unable to verify your session. Please request a new reset link.');
        }
      });
    }
  }, [location]);

  const onSubmit = async (values: z.infer<typeof updatePasswordSchema>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the updateUser method to set the new password
      const { error } = await supabase.auth.updateUser({ 
        password: values.password 
      });

      if (error) {
        console.error('Error updating password:', error);
        setError(error.message);
      } else {
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
      console.error('Exception in update password:', e);
      setError(e.message || 'An error occurred');
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
            
            {success ? (
              <div className="text-center py-4">
                <div className="text-green-600 mb-2">Password updated successfully!</div>
                <div className="text-sm text-gray-500">Redirecting to login page...</div>
              </div>
            ) : (
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
