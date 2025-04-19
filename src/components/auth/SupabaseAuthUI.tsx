
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";

type SupabaseAuthUIView = "sign_in" | "sign_up" | "magic_link" | "forgotten_password" | "update_password";

interface SupabaseAuthUIProps {
  view?: SupabaseAuthUIView;
  redirectTo?: string;
}

export const SupabaseAuthUI = ({ 
  view = "sign_in", 
  redirectTo,
}: SupabaseAuthUIProps) => {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ 
        theme: ThemeSupa,
        style: {
          button: { 
            background: '#9b87f5',
            color: 'white',
          },
          anchor: { color: '#7E69AB' }
        }
      }}
      providers={[]}
      view={view}
      redirectTo={redirectTo}
      showLinks={true}
    />
  );
};
