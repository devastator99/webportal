import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DialogTitle, DialogDescription, DialogContent, Dialog, DialogHeader } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSiteUrl } from "@/utils/environmentUtils";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

interface ForgotPasswordFormProps {
  open: boolean;
  onClose: () => void;
}

const ForgotPasswordForm = ({ open, onClose }: ForgotPasswordFormProps) => {
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
      const siteOrigin = getSiteUrl();
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${siteOrigin}/verify-code`
        }
      });

      if (error) throw error;
      
      toast({
        variant: "default",
        title: "Check your email",
        description: "If an account exists, a verification code has been sent.",
      });
      onClose();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message || "Failed to send verification code",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Password Recovery</DialogTitle>
          <DialogDescription>
            Enter your email to receive a password reset link
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="email@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordForm;