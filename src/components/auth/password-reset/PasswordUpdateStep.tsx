
import { Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideLoader2 } from 'lucide-react';

interface PasswordUpdateStepProps {
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}

export const PasswordUpdateStep = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  onClose,
  loading,
  error
}: PasswordUpdateStepProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
  );
};
