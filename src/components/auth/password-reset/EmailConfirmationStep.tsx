
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideLoader2 } from 'lucide-react';

interface EmailConfirmationStepProps {
  email: string;
  setEmail: (value: string) => void;
  phoneNumber: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBackToOtp: () => void;
  onStartOver: () => void;
  loading: boolean;
  error: string | null;
}

export const EmailConfirmationStep = ({
  email,
  setEmail,
  phoneNumber,
  onSubmit,
  onBackToOtp,
  onStartOver,
  loading,
  error
}: EmailConfirmationStepProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center space-y-4 mb-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-yellow-100 p-3">
            <Mail className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
        <p className="text-lg font-medium">Account Linking Required</p>
        <p className="text-gray-600 text-sm">
          We couldn't find an account with the phone number {phoneNumber}. 
          Please enter your email address to link this phone number to your account.
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            className="w-full pl-10"
            required
          />
        </div>
        <p className="text-xs text-gray-500">
          This should be the email address you used to create your account
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
            Linking Account...
          </span>
        ) : (
          'Link Phone Number'
        )}
      </Button>
      
      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={onBackToOtp}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to OTP Verification
        </button>
        <br />
        <button
          type="button"
          onClick={onStartOver}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Start Over
        </button>
      </div>
    </form>
  );
};
