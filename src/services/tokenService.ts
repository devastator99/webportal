
import { supabase } from '@/integrations/supabase/client';
import { getBaseUrl } from '@/utils/environmentUtils';
import { toast } from 'sonner';

export class TokenService {
  static async verifyRecoveryToken(token: string): Promise<boolean> {
    try {
      console.log("Verifying recovery token");
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error) {
        console.error("Token verification error:", error);
        toast.error("Password reset link is invalid or has expired");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception in token verification:", error);
      return false;
    }
  }

  static getPasswordResetRedirectUrl(): string {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/auth/update-password`;
  }

  static extractRecoveryToken(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }

  static isRecoveryFlow(): boolean {
    const params = new URLSearchParams(window.location.search);
    return params.get('type') === 'recovery';
  }
}
