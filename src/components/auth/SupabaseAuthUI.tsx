
import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

interface SupabaseAuthUIProps {
  view?: 'sign_in' | 'sign_up';
  redirectTo?: string;
  showLinks?: boolean;
}

export const SupabaseAuthUI = ({ 
  view = 'sign_in', 
  redirectTo = `${window.location.origin}/auth`,
  showLinks = true 
}: SupabaseAuthUIProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Remove the immediate redirect - let AuthContext and routing handle it properly
  // The Auth page will handle redirects once both user and role are loaded
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('SupabaseAuthUI: User signed in successfully, auth flow will handle redirect');
        // Don't redirect immediately - let the auth context load the role first
        // The Auth page component will handle the redirect once role is loaded
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Auth
      supabaseClient={supabase}
      view={view}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#9b87f5',
              brandAccent: '#7E69AB',
            },
          },
        },
      }}
      providers={[]}
      redirectTo={redirectTo}
      showLinks={showLinks}
    />
  );
};
