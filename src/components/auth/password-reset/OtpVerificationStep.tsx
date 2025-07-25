import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideLoader2, AlertCircle, PhoneOff, Info, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OtpVerificationStepProps {
  otp: string;
  setOtp: (value: string) => void;
  phoneNumber: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onResendOtp: () => void;
  onChangePhone: () => void;
  onSwitchToEmail?: () => void;
  loading: boolean;
  error: string | null;
}

export const OtpVerificationStep = ({
  otp,
  setOtp,
  phoneNumber,
  onSubmit,
  onResendOtp,
  onChangePhone,
  onSwitchToEmail,
  loading,
  error
}: OtpVerificationStepProps) => {
  const navigate = useNavigate();

  const handleOtpInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = otp.split('');
      while (newOtp.length < 6) newOtp.push('');
      newOtp[index] = value;
      setOtp(newOtp.join(''));
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.querySelector(`input[data-otp-index="${index + 1}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.querySelector(`input[data-otp-index="${index - 1}"]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Check if error indicates phone not registered
  const isPhoneNotRegistered = error?.includes('not registered') || error?.includes('not found');

  const handleEmailResetClick = () => {
    if (onSwitchToEmail) {
      onSwitchToEmail();
    } else {
      // Navigate to the forgot password page to access email reset
      navigate('/forgot-password');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Enter OTP
        </label>
        <div className="flex justify-center">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Input
                key={index}
                type="text"
                maxLength={1}
                value={otp[index] || ''}
                onChange={(e) => handleOtpInputChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                data-otp-index={index}
                className="w-10 h-10 text-center"
                disabled={loading}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Enter the 6-digit code sent to {phoneNumber}
        </p>
      </div>

      {/* Helpful info when no error */}
      {!error && (
        <div className="text-sm p-3 rounded-md border bg-blue-50 border-blue-200 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-700 font-medium">Verification Process</p>
            <p className="text-blue-600 text-xs mt-1">
              If your phone number isn't registered with any account, you'll receive clear guidance on next steps.
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <div className={`text-sm p-3 rounded-md border flex items-start gap-2 ${
          isPhoneNotRegistered 
            ? 'text-orange-600 bg-orange-50 border-orange-200' 
            : 'text-red-500 bg-red-50 border-red-200'
        }`}>
          {isPhoneNotRegistered ? (
            <PhoneOff className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {isPhoneNotRegistered 
                ? 'Phone Number Not Registered' 
                : 'Verification Failed'
              }
            </p>
            <p className="text-xs mt-1">{error}</p>
            {isPhoneNotRegistered && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3 w-3" />
                  <span className="font-medium">Alternative: Use email reset instead</span>
                </div>
                <button
                  type="button"
                  onClick={handleEmailResetClick}
                  className="text-xs text-blue-600 hover:text-blue-700 underline font-medium block"
                >
                  Reset password with email →
                </button>
                <p className="text-xs">
                  You can also contact support if you need assistance linking this phone number to your account.
                </p>
              </div>
            )}
          </div>
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
          onClick={onChangePhone}
          className="text-sm text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          Change Phone Number
        </button>
        <br />
        <button
          type="button"
          onClick={onResendOtp}
          className="text-sm text-blue-600 hover:text-blue-700"
          disabled={loading}
        >
          Resend OTP
        </button>
      </div>
    </form>
  );
};
