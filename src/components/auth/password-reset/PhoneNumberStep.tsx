
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideLoader2 } from 'lucide-react';

interface PhoneNumberStepProps {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export const PhoneNumberStep = ({
  phoneNumber,
  setPhoneNumber,
  onSubmit,
  loading,
  error,
  onClose
}: PhoneNumberStepProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
  );
};
