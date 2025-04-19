
import { supabase } from '@/integrations/supabase/client';
import { getBaseUrl } from '@/utils/environmentUtils';

export class TokenService {
  static isPasswordUpdatePath(): boolean {
    return window.location.pathname === '/auth/update-password';
  }

  static getPasswordUpdateRedirectUrl(): string {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/auth/update-password`;
  }

  static async checkUserSession(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }
}
