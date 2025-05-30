
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRegistrationStatus, RegistrationStatusValues } from '@/types/registration';
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
  
  // Helper function to check if registration is truly complete
  const isRegistrationFullyComplete = (regStatus: UserRegistrationStatus): boolean => {
    if (regStatus.registration_status !== RegistrationStatusValues.FULLY_REGISTERED) {
      return false;
    }
    
    // Check if all required tasks are actually completed
    const requiredTaskTypes = ['assign_care_team', 'create_chat_room', 'send_welcome_notification'];
    const completedTasks = regStatus.tasks?.filter(task => task.status === 'completed') || [];
    const completedTaskTypes = completedTasks.map(task => task.task_type);
    
    return requiredTaskTypes.every(taskType => completedTaskTypes.includes(taskType));
  };
  
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      // Only check for patients with valid roles
      if (!user?.id || userRole !== 'patient') {
        console.log("RegistrationStatusChecker: Not a patient or no user, skipping check");
        setIsChecking(false);
        return;
      }
      
      // Prevent infinite loops - be more conservative about redirects
      const criticalPaths = ['/register', '/auth/register', '/dashboard'];
      const isOnCriticalPath = criticalPaths.some(path => location.pathname.includes(path));
      
      if (location.pathname.includes('/register') || hasRedirected) {
        console.log("RegistrationStatusChecker: Already on registration page or redirected, skipping");
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
        
        // Check if registration is truly complete
        const isFullyComplete = isRegistrationFullyComplete(regStatus);
        
        if (isFullyComplete) {
          console.log("RegistrationStatusChecker: Registration is fully complete, clearing flags and proceeding");
          localStorage.removeItem('registration_payment_pending');
          localStorage.removeItem('registration_payment_complete');
          localStorage.removeItem('registration_step');
          localStorage.removeItem('registration_user_role');
          setIsChecking(false);
          return;
        }
        
        // Only redirect for incomplete registrations if we're in a safe state
        if (regStatus.registration_status === RegistrationStatusValues.PAYMENT_PENDING) {
          console.log("RegistrationStatusChecker: Registration payment pending, will redirect if safe");
          localStorage.setItem('registration_payment_pending', 'true');
          localStorage.setItem('registration_payment_complete', 'false');
          
          // Only redirect if we're not already in a critical flow
          if (!isOnCriticalPath) {
            setHasRedirected(true);
            navigate('/register', { replace: true });
            return;
          }
        }
        
        // For other incomplete statuses, be very conservative
        if ([
          RegistrationStatusValues.PAYMENT_COMPLETE, 
          RegistrationStatusValues.CARE_TEAM_ASSIGNED
        ].includes(regStatus.registration_status)) {
          console.log("RegistrationStatusChecker: Registration progress pending, but being conservative");
          localStorage.setItem('registration_payment_pending', 'false');
          localStorage.setItem('registration_payment_complete', 'true');
          
          // Only redirect if absolutely necessary and safe
          if (location.pathname === '/' || location.pathname === '/home') {
            setHasRedirected(true);
            navigate('/register', { replace: true });
            return;
          }
        }
        
        setIsChecking(false);
      } catch (err) {
        console.error("RegistrationStatusChecker: Error in registration status check:", err);
        setIsChecking(false);
      }
    };
    
    // Add a delay to prevent immediate redirect loops and allow auth state to settle
    const timeoutId = setTimeout(() => {
      checkRegistrationStatus();
    }, 500);
    
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
