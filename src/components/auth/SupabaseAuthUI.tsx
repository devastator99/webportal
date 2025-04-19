
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type SupabaseAuthUIView = "sign_in" | "magic_link" | "forgotten_password" | "update_password";

interface SupabaseAuthUIProps {
  view?: SupabaseAuthUIView;
  redirectTo?: string;
}

export const SupabaseAuthUI = ({ 
  view = "sign_in", 
  redirectTo,
}: SupabaseAuthUIProps) => {
  return (
    <div className="space-y-6">
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
        localization={{
          variables: {
            sign_in: {
              email_input_placeholder: "Your email address",
              password_input_placeholder: "Your password",
              button_label: "Sign in",
            },
          }
        }}
      />
      {view === 'sign_in' && (
        <div className="text-center">
          <Link 
            to="/auth/register" 
            className="text-sm font-medium text-purple-600 hover:text-purple-500"
          >
            Don't have an account? Sign up here
          </Link>
        </div>
      )}
    </div>
  );
};
