
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Log environment info on component mount
  useEffect(() => {
    const envInfo = getEnvironmentInfo();
    console.log("SupabaseAuthUI environment info:", envInfo);
  }, []);
  
  // We use this effect to detect password reset successes
  useEffect(() => {
    const handleAuthStateChange = async (event: string) => {
      console.log("Auth state change:", event);
      
      if (event === 'PASSWORD_RECOVERY') {
        toast.success('Password recovery email sent', {
          description: 'Check your email for the password reset link'
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/auth?reset_sent=true');
        }
      } else if (event === 'PASSWORD_RESET') {
        toast.success('Password has been reset successfully!');
        navigate('/auth');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      handleAuthStateChange(event);
    });

    setIsLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, onSuccess]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading auth UI...</div>;
  }

  // Get the proper redirect URL for auth flow
  const finalRedirectTo = redirectTo 
    ? getAuthRedirectUrl(redirectTo)
    : getAuthRedirectUrl('/auth?type=recovery');

  console.log("Rendering SupabaseAuthUI with view:", view, "and initialEmail:", initialEmail);
  console.log("Using redirect URL:", finalRedirectTo);

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
