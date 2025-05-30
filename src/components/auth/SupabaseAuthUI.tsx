
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

  // Do NOT redirect here - let Auth page handle all redirects after role is loaded
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('SupabaseAuthUI: User signed in, letting Auth page handle redirect after role loads');
        // NO REDIRECT HERE - Auth page will handle it once role is confirmed
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
