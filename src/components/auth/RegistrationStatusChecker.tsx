
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UserRegistrationStatus } from '@/types/registration';
import { Card, CardContent } from '@/components/ui/card';

interface RegistrationStatusCheckerProps {
  children: React.ReactNode;
}

export const RegistrationStatusChecker: React.FC<RegistrationStatusCheckerProps> = ({ children }) => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [redirected, setRedirected] = useState(false);
  
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!user?.id || userRole !== 'patient') {
        setIsChecking(false);
        return;
      }
      
      try {
        console.log("Checking registration status for patient:", user.id);
        // Use the new secure function that bypasses RLS issues
        const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
          p_user_id: user.id
        });
        
        if (error) {
          console.error("Error checking registration status:", error);
          setIsChecking(false);
          return;
        }
        
        const regStatus = data as unknown as UserRegistrationStatus;
        
        // If payment is pending, redirect to registration page
        if (regStatus.registration_status === 'payment_pending' && !redirected) {
          console.log("Registration payment pending, redirecting to auth/register");
          localStorage.setItem('registration_payment_pending', 'true');
          localStorage.setItem('registration_payment_complete', 'false');
          setRedirected(true);
          navigate('/auth/register', { replace: true });
          return;
        }
        
        setIsChecking(false);
      } catch (err) {
        console.error("Error in registration status check:", err);
        setIsChecking(false);
      }
    };
    
    checkRegistrationStatus();
  }, [user?.id, userRole, navigate, redirected]);
  
  if (isChecking) {
    return (
      <Card className="shadow-none border-none">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
        </CardContent>
      </Card>
    );
  }
  
  return <>{children}</>;
};
