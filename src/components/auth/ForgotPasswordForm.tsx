
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const ForgotPasswordForm = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Store the email in local storage for later use in update password form
      localStorage.setItem('passwordResetEmail', email);
      
      console.log("Sending password reset email to:", email);
      
      // Use the edge function to send a simple password reset email
      const { data, error } = await supabase.functions.invoke('send-password-reset-email', {
        body: { 
          email, 
          resetUrl: `${window.location.origin}/auth/update-password` 
        }
      });

      if (error) {
        console.error("Password reset error:", error);
        throw new Error(error.message || "Failed to send password reset email");
      }

      console.log("Password reset response:", data);
      toast.success('Password reset instructions have been sent to your email');
      if (onClose) onClose();
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || 'Error sending password reset email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Reset Password</h2>
      <p className="text-sm text-gray-600 text-center">
        Enter your email address to receive password reset instructions.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
        />
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
        </Button>
      </form>
    </div>
  );
};
