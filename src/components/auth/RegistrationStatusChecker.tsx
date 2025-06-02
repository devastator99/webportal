
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
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
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
      // Only check for patients with valid roles and avoid checking multiple times
      if (!user?.id || userRole !== 'patient' || hasChecked) {
        console.log("RegistrationStatusChecker: Skipping check - not a patient, no user, or already checked");
        setIsChecking(false);
        return;
      }
      
      // Prevent checking on certain critical paths
      const criticalPaths = ['/dashboard', '/auth/register', '/auth'];
      const isOnCriticalPath = criticalPaths.some(path => location.pathname.includes(path));
      
      if (isOnCriticalPath) {
        console.log("RegistrationStatusChecker: On critical path, skipping registration check");
        setIsChecking(false);
        setHasChecked(true);
        return;
      }
      
      setIsChecking(true);
      
      try {
        console.log("RegistrationStatusChecker: Checking registration status for patient:", user.id);
        
        const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
          p_user_id: user.id
        });
        
        if (error) {
          console.error("RegistrationStatusChecker: Error checking registration status:", error);
          setIsChecking(false);
          setHasChecked(true);
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
          setIsChecking(false);
          setHasChecked(true);
          return;
        }
        
        // Only redirect for payment pending status, and only if not on dashboard
        if (regStatus.registration_status === RegistrationStatusValues.PAYMENT_PENDING && !location.pathname.includes('/dashboard')) {
          console.log("RegistrationStatusChecker: Payment pending and safe to redirect");
          localStorage.setItem('registration_payment_pending', 'true');
          localStorage.setItem('registration_payment_complete', 'false');
          navigate('/auth/register', { replace: true });
          return;
        }
        
        // For other statuses, just mark as checked and continue
        console.log("RegistrationStatusChecker: Registration incomplete but continuing normally");
        setIsChecking(false);
        setHasChecked(true);
        
      } catch (err) {
        console.error("RegistrationStatusChecker: Error in registration status check:", err);
        setIsChecking(false);
        setHasChecked(true);
      }
    };
    
    // Only check once per session
    if (!hasChecked && user?.id && userRole === 'patient') {
      const timeoutId = setTimeout(() => {
        checkRegistrationStatus();
      }, 500); // Small delay to prevent immediate checks
      
      return () => clearTimeout(timeoutId);
    }
  }, [user?.id, userRole, navigate, location.pathname, hasChecked]);
  
  // Show loading only if actively checking and not already on dashboard
  if (isChecking && !location.pathname.includes('/dashboard')) {
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
