
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { AuthView } from "@/types/auth";

interface SupabaseAuthUIProps {
  view?: AuthView;
  redirectTo?: string;
  showLinks?: boolean;
  className?: string;
}

export const SupabaseAuthUI = ({ 
  view = "sign_in", 
  redirectTo,
  showLinks = true,
  className
}: SupabaseAuthUIProps) => {
  return (
    <div className={`space-y-6 ${className} overflow-auto`}>
      <Auth
        supabaseClient={supabase}
        view={view}
        showLinks={false}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: 'hsl(0 0% 9%)',
                brandAccent: 'hsl(0 0% 20%)',
                anchorTextColor: 'hsl(0 0% 90%)',
              },
              borderWidths: {
                buttonBorderWidth: '1px',
                inputBorderWidth: '1px',
              },
              radii: {
                buttonBorderRadius: '8px',
                inputBorderRadius: '8px',
              },
            },
          },
          className: {
            container: 'auth-form-container',
            button: 'auth-button',
            input: 'auth-input',
            label: 'auth-label',
            anchor: 'auth-link'
          },
        }}
        providers={[]}
        redirectTo={redirectTo}
        localization={{
          variables: {
            sign_in: {
              email_input_placeholder: "Enter your email",
              password_input_placeholder: "Enter your password",
              button_label: "Continue",
              link_text: "Trouble signing in?",
            }
          }
        }}
      />

      {view === 'sign_in' && showLinks && (
        <div className="text-center space-y-4">
          <div>
            <Link 
              to="/auth/register" 
              className="text-sm font-medium text-purple-600 hover:text-purple-500"
            >
              Don't have an account? Register now
            </Link>
          </div>
          <div>
            <Link 
              to="/forgot-password" 
              className="text-sm font-medium text-purple-600 hover:text-purple-500"
            >
              Forgot password? Verify with code
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
