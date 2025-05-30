
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

  // Listen for auth state changes to handle navigation
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Don't automatically redirect to dashboard - stay on current page
        // Let the parent component handle navigation logic
        console.log('SupabaseAuthUI: User signed in, staying on current page');
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
