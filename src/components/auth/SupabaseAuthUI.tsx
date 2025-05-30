
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

  // Listen for auth state changes but be careful about navigation during registration
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if we're in registration flow - if so, don't navigate
        if (location.pathname.includes('/register')) {
          console.log('SupabaseAuthUI: User signed in during registration, staying in registration flow');
          return;
        }
        
        // Only navigate if we're not in registration and not already on auth page
        console.log('SupabaseAuthUI: User signed in, staying on current page for parent to handle');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

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
