
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

interface ForgotPasswordFormProps {
  onClose: () => void;
}

export const ForgotPasswordForm = ({ onClose }: ForgotPasswordFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  const onSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      // Create the absolute URL for password reset with explicit path
      const baseUrl = window.location.origin;
      
      // Use a fully qualified path to ensure proper routing
      const redirectTo = `${baseUrl}/update-password?type=recovery`;
      
      console.log("Sending reset password with redirect to:", redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo,
      });
      
      if (error) {
        console.error("Reset password error:", error);
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: error.message,
        });
      } else {
        toast({
          variant: "default",
          title: "Check your email",
          description: "If an account exists for this email, a password reset link has been sent.",
        });
        onClose();
      }
    } catch (e: any) {
      console.error("Exception in reset password:", e);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: e.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <DialogTitle>Reset Password</DialogTitle>
      <DialogDescription>
        Enter your account email. We'll send password reset instructions.
      </DialogDescription>
      <Form {...form}>
        <form
          className="space-y-3 mt-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your@email.com" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
