
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideLoader2, ArrowLeft, Mail } from 'lucide-react';

interface EmailInputStepProps {
  email: string;
  setEmail: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export const EmailInputStep = ({
  email,
  setEmail,
  onSubmit,
  onBack,
  loading,
  error
}: EmailInputStepProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <Mail className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Enter Email Address</h3>
        <p className="text-sm text-gray-600 mt-2">
          We'll send a verification code to your email address
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full"
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <Button 
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700"
        disabled={loading || !email.trim()}
      >
        {loading ? (
          <span className="flex items-center">
            <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Code...
          </span>
        ) : (
          'Send Verification Code'
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4" />
          Choose Different Method
        </button>
      </div>
    </form>
  );
};
