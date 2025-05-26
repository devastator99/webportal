
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideLoader2, AlertCircle, PhoneOff } from 'lucide-react';

interface OtpVerificationStepProps {
  otp: string;
  setOtp: (value: string) => void;
  phoneNumber: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onResendOtp: () => void;
  onChangePhone: () => void;
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
  loading,
  error
}: OtpVerificationStepProps) => {
  const handleOtpInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = otp.split('');
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
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Enter the 6-digit code sent to {phoneNumber}
        </p>
      </div>
      
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
              {isPhoneNotRegistered ? 'Phone Number Not Registered' : 'Verification Failed'}
            </p>
            <p className="text-xs mt-1">{error}</p>
            {isPhoneNotRegistered && (
              <p className="text-xs mt-2 font-medium">
                You'll need to link this phone number to your email address to continue.
              </p>
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
