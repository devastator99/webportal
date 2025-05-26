import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { LucideLoader2, CheckCircle, Phone, Lock } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';

interface SmsOtpPasswordResetProps {
  open: boolean;
  onClose: () => void;
}

const SmsOtpPasswordReset = ({ open, onClose }: SmsOtpPasswordResetProps) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[SMS OTP] Sending OTP to:', phoneNumber);
      
      const { data, error } = await supabase.functions.invoke('send-password-reset-sms', {
        body: { 
          phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to send OTP');
      }

      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('[SMS OTP] OTP sent successfully');
      setStep('otp');
      toast({
        title: 'OTP Sent',
        description: 'Check your phone for the verification code.',
      });
      
    } catch (error: any) {
      console.error('SMS OTP send error:', error);
      setError(error.message || 'Failed to send OTP');
      toast({
        title: 'Failed to Send OTP',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[SMS OTP] Verifying OTP:', otp);
      
      const { data, error } = await supabase.functions.invoke('verify-password-reset-otp', {
        body: { 
          phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`,
          otp 
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Invalid OTP');
      }

      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('[SMS OTP] OTP verified successfully');
      setSessionToken(data.sessionToken);
      setStep('password');
      toast({
        title: 'OTP Verified',
        description: 'Please set your new password.',
      });
      
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message || 'Invalid OTP';
      
      if (error.message?.includes('No account found')) {
        errorMessage = 'No account found with this phone number. Please ensure your phone number is registered or try a different number.';
      } else if (error.message?.includes('Invalid or expired')) {
        errorMessage = 'The OTP has expired or is invalid. Please request a new OTP.';
      }
      
      setError(errorMessage);
      toast({
        title: 'OTP Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[SMS OTP] Updating password');
      
      const { data, error } = await supabase.functions.invoke('update-password-with-sms-token', {
        body: { 
          sessionToken,
          newPassword 
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to update password');
      }

      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('[SMS OTP] Password updated successfully');
      toast({
        title: 'Password Updated',
        description: 'Your password has been updated successfully.',
      });
      
      onClose();
      
    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message || 'Failed to update password');
      toast({
        title: 'Password Update Failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSessionToken(null);
  };

  return (
    <ScrollArea className="max-h-[80vh]" invisibleScrollbar={true}>
      <div className="p-4">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Password via SMS</h2>
        
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter the phone number registered with your account
              </p>
            </div>
            
            {error && (
              <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <Button 
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </span>
              ) : (
                'Send OTP'
              )}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Enter OTP
              </label>
              <div className="flex justify-center">
                <InputOTP 
                  value={otp} 
                  onChange={setOtp} 
                  maxLength={6}
                  containerClassName="gap-2"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Enter the 6-digit code sent to {phoneNumber}
              </p>
            </div>
            
            {error && (
              <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <Button 
              type="submit"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <span className="flex items-center">
                  <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </Button>
            
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={resetFlow}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Change Phone Number
              </button>
              <br />
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-sm text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="text-center space-y-4 mb-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-lg font-medium">OTP Verified</p>
              <p className="text-gray-600">Now set your new password</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <Button 
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update Password'
              )}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </ScrollArea>
  );
};

export default SmsOtpPasswordReset;
