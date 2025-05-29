
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRegistrationStatus } from '@/types/registration';
import { Card, CardContent } from '@/components/ui/card';

interface RegistrationStatusCheckerProps {
  children: React.ReactNode;
}

export const RegistrationStatusChecker: React.FC<RegistrationStatusCheckerProps> = ({ children }) => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      // Only check for patients
      if (!user?.id || userRole !== 'patient') {
        console.log("RegistrationStatusChecker: Not a patient or no user, skipping check");
        setIsChecking(false);
        return;
      }
      
      // Prevent infinite loops - if we're already on the registration page, don't redirect
      if (location.pathname.includes('/auth/register')) {
        console.log("RegistrationStatusChecker: Already on registration page, skipping redirect");
        setIsChecking(false);
        return;
      }
      
      // Don't check if we've already redirected in this session
      if (hasRedirected) {
        console.log("RegistrationStatusChecker: Already redirected in this session, skipping");
        setIsChecking(false);
        return;
      }
      
      try {
        console.log("RegistrationStatusChecker: Checking registration status for patient:", user.id);
        
        const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
          p_user_id: user.id
        });
        
        if (error) {
          console.error("RegistrationStatusChecker: Error checking registration status:", error);
          setIsChecking(false);
          return;
        }
        
        const regStatus = data as unknown as UserRegistrationStatus;
        console.log("RegistrationStatusChecker: Registration status:", regStatus.registration_status);
        
        // Handle incomplete registration states
        if (regStatus.registration_status === 'payment_pending') {
          console.log("RegistrationStatusChecker: Registration payment pending, redirecting to auth/register");
          localStorage.setItem('registration_payment_pending', 'true');
          localStorage.setItem('registration_payment_complete', 'false');
          setHasRedirected(true);
          navigate('/auth/register', { replace: true });
          return;
        }
        
        if (['payment_complete', 'care_team_assigned'].includes(regStatus.registration_status)) {
          console.log("RegistrationStatusChecker: Registration progress pending, redirecting to auth/register");
          localStorage.setItem('registration_payment_pending', 'false');
          localStorage.setItem('registration_payment_complete', 'true');
          setHasRedirected(true);
          navigate('/auth/register', { replace: true });
          return;
        }
        
        // If fully registered, clear any localStorage flags and proceed
        if (regStatus.registration_status === 'fully_registered') {
          console.log("RegistrationStatusChecker: Registration complete, clearing flags");
          localStorage.removeItem('registration_payment_pending');
          localStorage.removeItem('registration_payment_complete');
        }
        
        setIsChecking(false);
      } catch (err) {
        console.error("RegistrationStatusChecker: Error in registration status check:", err);
        setIsChecking(false);
      }
    };
    
    // Add a small delay to prevent immediate redirect loops
    const timeoutId = setTimeout(() => {
      checkRegistrationStatus();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [user?.id, userRole, navigate, location.pathname, hasRedirected]);
  
  // Show loading if we're still checking registration
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
