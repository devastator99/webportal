import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { LucideLoader2 } from 'lucide-react';

const verifyCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

export const VerifyCodePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      email: localStorage.getItem('forgotPasswordEmail') || '',
      code: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof verifyCodeSchema>) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: values.email,
        token: values.code,
        type: 'magiclink', // because email OTP is treated as 'magiclink' type
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: error.message,
        });
      } else {
        toast({
          variant: "default",
          title: "Verification Successful",
          description: "You can now reset your password",
        });
        navigate('/update-password');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Enter 6-digit code" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-md hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LucideLoader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Verify Code
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default VerifyCodePage;
