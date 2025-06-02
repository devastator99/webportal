
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
    // For now, consider payment_complete as sufficient for most functionality
    // The tasks may still be processing in the background
    if (regStatus.registration_status === RegistrationStatusValues.FULLY_REGISTERED ||
        regStatus.registration_status === 'payment_complete') {
      return true;
    }
    
    return false;
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
        
        // Try the RPC function first, fallback to direct query
        let regData: UserRegistrationStatus;
        
        try {
          const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
            p_user_id: user.id
          });
          
          if (error) {
            throw error;
          }
          
          regData = data as unknown as UserRegistrationStatus;
        } catch (rpcError) {
          console.warn("RPC failed, using fallback query:", rpcError);
          
          // Fallback to direct query
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('registration_status')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            throw profileError;
          }
          
          regData = {
            registration_status: profileData?.registration_status || 'payment_pending',
            registration_completed_at: null,
            tasks: []
          };
        }
        
        console.log("RegistrationStatusChecker: Registration status:", regData.registration_status);
        
        // Check if registration is complete enough for normal operation
        const isComplete = isRegistrationFullyComplete(regData);
        
        if (isComplete) {
          console.log("RegistrationStatusChecker: Registration is complete, clearing flags and proceeding");
          localStorage.removeItem('registration_payment_pending');
          localStorage.removeItem('registration_payment_complete');
          setIsChecking(false);
          setHasChecked(true);
          return;
        }
        
        // Only redirect for payment pending status, and only if not on dashboard
        if (regData.registration_status === RegistrationStatusValues.PAYMENT_PENDING && !location.pathname.includes('/dashboard')) {
          console.log("RegistrationStatusChecker: Payment pending and safe to redirect");
          localStorage.setItem('registration_payment_pending', 'true');
          localStorage.setItem('registration_payment_complete', 'false');
          navigate('/auth/register', { replace: true });
          return;
        }
        
        // For other statuses, just mark as checked and continue
        console.log("RegistrationStatusChecker: Registration status acceptable, continuing normally");
        setIsChecking(false);
        setHasChecked(true);
        
      } catch (err) {
        console.error("RegistrationStatusChecker: Error in registration status check:", err);
        // On error, don't block the user - let them proceed
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
