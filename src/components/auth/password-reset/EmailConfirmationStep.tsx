
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideLoader2, AlertCircle, ArrowLeft, Mail } from 'lucide-react';

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
      <div className="text-center space-y-2">
        <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
        <h3 className="text-lg font-semibold text-gray-900">Phone Number Not Found</h3>
        <p className="text-sm text-gray-600">
          The phone number {phoneNumber} is not registered with any account.
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
          Enter the email address associated with your account to link this phone number
        </p>
      </div>
      
      {error && (
        <div className="text-sm text-amber-600 p-3 bg-amber-50 rounded-md border border-amber-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Service Currently Unavailable</p>
            <p className="text-xs mt-1">{error}</p>
            <p className="text-xs mt-2 font-medium">
              Please use the email reset option instead, or contact support for assistance.
            </p>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
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
            'Link Phone to Account'
          )}
        </Button>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBackToOtp}
            className="flex-1"
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to OTP
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={onStartOver}
            className="flex-1"
            disabled={loading}
          >
            Start Over
          </Button>
        </div>
      </div>
    </form>
  );
};
