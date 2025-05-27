
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, ArrowLeft } from 'lucide-react';
import type { ResetMethod } from './types';

interface MethodSelectionStepProps {
  onMethodSelect: (method: ResetMethod) => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}

export const MethodSelectionStep = ({
  onMethodSelect,
  onClose,
  loading,
  error
}: MethodSelectionStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Choose Reset Method</h3>
        <p className="text-sm text-gray-600 mt-2">
          How would you like to receive your password reset code?
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={() => onMethodSelect('sms')}
          disabled={loading}
          className="w-full h-16 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageSquare className="h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">SMS / Text Message</div>
            <div className="text-xs opacity-90">Get code via phone number</div>
          </div>
        </Button>

        <Button
          onClick={() => onMethodSelect('email')}
          disabled={loading}
          className="w-full h-16 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white"
        >
          <Mail className="h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Email</div>
            <div className="text-xs opacity-90">Get code via email address</div>
          </div>
        </Button>
      </div>

      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </button>
      </div>
    </div>
  );
};
