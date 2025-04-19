
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideLoader2 } from 'lucide-react';
import { toast } from 'sonner';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleUpdatePassword, loading, error } = useAuthHandlers();

  // Get token from URL
  const token = searchParams.get('token') || searchParams.get('access_token');

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      navigate('/auth/forgot-password');
    }
  }, [token, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await handleUpdatePassword(password);
    } catch (err) {
      console.error("Update password error:", err);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          Set new password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center">
              <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="mt-4 text-sm text-gray-600">Updating your password...</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New password
                </label>
                <div className="mt-1">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full"
                    placeholder="Enter your new password"
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  Update password
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
