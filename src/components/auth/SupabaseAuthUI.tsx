
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";

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
  const authProps = {
    supabaseClient: supabase,
    appearance: { theme: ThemeSupa },
    providers: [],
    view: view,
    // Add view parameter to redirect URL for proper password reset flow
    redirectTo: `${window.location.origin}/auth?view=update_password`,
    onlyThirdPartyProviders: false,
  };

  return <Auth {...authProps} />;
};
