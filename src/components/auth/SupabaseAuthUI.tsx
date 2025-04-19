
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { getAuthRedirectUrl, getEnvironmentInfo } from '@/utils/environmentUtils';
import { toast } from 'sonner';

interface SupabaseAuthUIProps {
  view?: 'sign_in' | 'sign_up' | 'magic_link' | 'forgotten_password' | 'update_password';
  redirectTo?: string;
  onSuccess?: () => void;
  initialEmail?: string;
}

export const SupabaseAuthUI = ({ 
  view = 'sign_in', 
  redirectTo,
  onSuccess,
  initialEmail = ''
}: SupabaseAuthUIProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState(view);
  
  // Log environment info and URL info on component mount
  useEffect(() => {
    const envInfo = getEnvironmentInfo();
    const pathname = location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    const urlParams = new URLSearchParams(search);
    const type = urlParams.get('type');
    
    console.log("SupabaseAuthUI - URL and environment info:", { 
      pathname, hash, search, type,
      envInfo 
    });
    
    // Detect password reset flow from URL path, hash or query params
    const isPasswordReset = 
      pathname === '/auth/update-password' ||
      (hash && hash.includes('type=recovery')) || 
      (type === 'recovery');
    
    if (isPasswordReset && view !== 'update_password') {
      console.log("Setting view to update_password due to recovery flow detection");
      setCurrentView('update_password');
    }
  }, [view, location]);
  
  useEffect(() => {
    const handleAuthStateChange = async (event: string, session: any) => {
      console.log("Auth state change:", { event, session });
      
      if (event === 'PASSWORD_RECOVERY') {
        toast.success('Password recovery email sent', {
          description: 'Check your email for the password reset link'
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/auth?reset_sent=true');
        }
      } else if (event === 'SIGNED_IN' && currentView === 'update_password') {
        toast.success('Password has been updated successfully!');
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/auth');
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    setIsLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, onSuccess, currentView]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading auth UI...</div>;
  }

  // Get the proper redirect URL for auth flow
  const finalRedirectTo = redirectTo 
    ? getAuthRedirectUrl(redirectTo)
    : currentView === 'update_password'
      ? getAuthRedirectUrl('/auth/update-password') // After password update, redirect to the update-password path
      : getAuthRedirectUrl('/auth/recovery?type=recovery'); // For password recovery, include the type

  console.log("Rendering SupabaseAuthUI with view:", currentView, "and redirectTo:", finalRedirectTo);

  return (
    <Auth
      supabaseClient={supabase}
      view={currentView}
      appearance={{ 
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#9b87f5',
              brandAccent: '#8B5CF6',
            },
          },
        },
      }}
      theme="light"
      showLinks={true}
      providers={[]}
      redirectTo={finalRedirectTo}
      magicLink={false}
      {...(initialEmail ? { emailInputProps: { defaultValue: initialEmail } } : {})}
    />
  );
};
