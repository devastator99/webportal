
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const ForgotPasswordForm = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Store email in local storage for the update password form
      localStorage.setItem('resetPasswordEmail', email);
      
      setSuccess(true);
      toast.success('Password reset initiated');
      
      // Navigate to the update password page directly without using email link
      setTimeout(() => {
        navigate('/auth/update-password');
      }, 1500);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || 'Error initiating password reset');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Reset Initiated!</h2>
        <p className="text-sm text-gray-600">
          Redirecting you to set a new password...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Reset Password</h2>
      <p className="text-sm text-gray-600 text-center">
        Enter your email address to reset your password.
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
          {loading ? 'Processing...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
};
