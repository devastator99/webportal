
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const ForgotPasswordForm = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Initiating password reset for:", email);
      
      // Use absolute URL to avoid any path issues
      // We're explicitly using the full URL with the type=recovery parameter
      const origin = window.location.origin;
      // Important: We're using a direct path to /auth without any query parameters
      // The recovery type will be handled from the hash fragment instead
      const resetUrl = `${origin}/auth`;
      
      console.log("Using reset URL:", resetUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success('Password reset link sent to your email');
      console.log("Password reset email sent successfully");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || 'Error sending reset password email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Email Sent!</h2>
        <p className="text-sm text-gray-600">
          Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
        </p>
        <Button 
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Reset Password</h2>
      <p className="text-sm text-gray-600 text-center">
        Enter your email address and we'll send you a link to reset your password.
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
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
    </div>
  );
};
