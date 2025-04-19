
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { getAuthRedirectUrl } from "@/utils/environmentUtils";

type SupabaseAuthUIView = "sign_in" | "sign_up" | "magic_link" | "forgotten_password" | "update_password";

interface SupabaseAuthUIProps {
  view?: SupabaseAuthUIView;
  redirectTo?: string;
  onSuccess?: () => void;
}

export const SupabaseAuthUI = ({ 
  view = "sign_in", 
  redirectTo,
  onSuccess 
}: SupabaseAuthUIProps) => {
  // For debugging auth redirects
  useEffect(() => {
    console.log("SupabaseAuthUI rendered with view:", view);
    console.log("Current URL:", window.location.href);
    console.log("Using redirectTo:", redirectTo || `${window.location.origin}/auth?view=update_password`);
  }, [view, redirectTo]);
  
  // Handle successful auth (especially important for password resets)
  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
      console.log("Auth event detected:", event);
      
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session) {
        console.log("Authentication successful, triggering onSuccess callback");
        onSuccess?.();
      }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    
    return () => {
      subscription.unsubscribe();
    };
  }, [onSuccess]);
  
  // Configure auth props with specific focus on password recovery flow
  const authProps = {
    supabaseClient: supabase,
    appearance: { theme: ThemeSupa },
    providers: [],
    view: view,
    // Always include view parameter in redirect URL for proper password reset flow
    redirectTo: redirectTo || `${window.location.origin}/auth?view=update_password`,
    onlyThirdPartyProviders: false,
  };

  return <Auth {...authProps} />;
};
