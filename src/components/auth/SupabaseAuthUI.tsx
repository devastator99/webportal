
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
  const [currentView, setCurrentView] = useState<SupabaseAuthUIView>(view);
  const location = useLocation();

  useEffect(() => {
    const envInfo = getEnvironmentInfo();
    const pathname = location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    const urlParams = new URLSearchParams(search);
    const type = urlParams.get('type');
    
    console.log("SupabaseAuthUI - URL recovery detection:", { 
      pathname, 
      hash, 
      type,
      envInfo 
    });
    
    const isPasswordReset = 
      pathname === '/auth/update-password' ||
      (hash && hash.includes('type=recovery')) || 
      (type === 'recovery');
    
    if (isPasswordReset && currentView !== 'update_password') {
      console.log("Setting view to update_password due to recovery flow detection");
      setCurrentView('update_password');
    }
  }, [currentView, location]);

  // Create proper props for the Auth component
  const authProps = {
    supabaseClient: supabase,
    appearance: { theme: ThemeSupa },
    providers: [],
    view: currentView,
    redirectTo: redirectTo,
    magicLink: false,
    showLinks: false,
    socialLayout: "horizontal" as const,
    forgotPasswordProps: {
      emailInputProps: {
        defaultValue: initialEmail,
      },
    }
  };

  return <Auth {...authProps} />;
};
