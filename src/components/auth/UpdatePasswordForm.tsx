
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { handleUpdatePassword, loading: isSubmitting } = useAuthHandlers();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      await handleUpdatePassword(data.password);
    } catch (error: any) {
      console.error('Error updating password:', error);
    }
  };

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
