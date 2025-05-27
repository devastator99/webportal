
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideLoader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useState } from 'react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordValid = newPassword && newPassword.length >= 6;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center space-y-2">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <h3 className="text-lg font-semibold text-gray-900">Set New Password</h3>
        <p className="text-sm text-gray-600">
          Your identity has been verified. Please enter your new password.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full pr-10"
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {newPassword && (
          <p className={`text-xs ${passwordValid ? 'text-green-600' : 'text-red-600'}`}>
            {passwordValid ? '✓ Password meets requirements' : '✗ Password must be at least 6 characters'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full pr-10"
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {confirmPassword && (
          <p className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
            {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
          </p>
        )}
      </div>
      
      {error && (
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      <div className="space-y-3">
        <Button 
          type="submit"
          className="w-full"
          disabled={loading || !passwordValid || !passwordsMatch}
        >
          {loading ? (
            <span className="flex items-center">
              <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Password...
            </span>
          ) : (
            'Update Password'
          )}
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="w-full"
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
