
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { AuthView } from "@/types/auth";

interface SupabaseAuthUIProps {
  view?: AuthView;
  redirectTo?: string;
  token?: string | null;
  showLinks?: boolean;
}

export const SupabaseAuthUI = ({ 
  view = "sign_in", 
  redirectTo,
  token,
  showLinks = true
}: SupabaseAuthUIProps) => {
  return (
    <div className="space-y-6">
      <Auth
        supabaseClient={supabase}
        view={view}
        showLinks={showLinks}
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
        redirectTo={redirectTo}
        queryParams={token ? { token } : undefined}
        localization={{
          variables: {
            sign_in: {
              email_input_placeholder: "Your email address",
              password_input_placeholder: "Your password",
              button_label: "Sign in",
            },
            update_password: {
              password_label: "New password",
              password_input_placeholder: "Enter your new password",
              button_label: "Update password",
            }
          }
        }}
      />
      {view === 'sign_in' && showLinks && (
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
