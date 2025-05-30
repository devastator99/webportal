
import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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

  // Handle auth state changes - let Auth page handle redirects after role loads
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('SupabaseAuthUI: User signed in, Auth page will handle redirect after role loads');
        // Database trigger will create role automatically
        // Auth page will handle redirect once role is confirmed and registration status is checked
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
        style: {
          button: {
            background: '#9b87f5',
            color: 'white',
            borderRadius: '6px',
          },
          anchor: {
            color: '#9b87f5',
          },
        },
      }}
      providers={[]}
      redirectTo={redirectTo}
      showLinks={showLinks}
    />
  );
};
