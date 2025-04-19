
import { useState, useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { getEnvironmentInfo } from "@/utils/environmentUtils";

type SupabaseAuthUIView = "sign_in" | "sign_up" | "magic_link" | "forgotten_password" | "update_password";

interface SupabaseAuthUIProps {
  view?: SupabaseAuthUIView;
  redirectTo?: string;
  onSuccess?: () => void;
  initialEmail?: string;
}

export const SupabaseAuthUI = ({ 
  view = "sign_in", 
  redirectTo, 
  onSuccess, 
  initialEmail = "" 
}: SupabaseAuthUIProps) => {
  const location = useLocation();
  const [currentView, setCurrentView] = useState<SupabaseAuthUIView>(view);

  useEffect(() => {
    // Simple check for recovery token in URL
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get('type');
    
    console.log("SupabaseAuthUI - URL detection:", { 
      hash, 
      type,
      pathname: location.pathname
    });

    if (type === 'recovery' || hash.includes('type=recovery') || location.pathname === '/auth/update-password') {
      console.log("Setting view to update_password");
      setCurrentView('update_password');
    }
  }, [location]);

  // Create proper props for the Auth component
  const authProps = {
    supabaseClient: supabase,
    appearance: { theme: ThemeSupa },
    providers: [],
    view: currentView,
    redirectTo: redirectTo,
    showLinks: false,
    onlyThirdPartyProviders: false,
    forgotPasswordProps: {
      emailInputProps: {
        defaultValue: initialEmail,
      },
    }
  };

  return <Auth {...authProps} />;
};
