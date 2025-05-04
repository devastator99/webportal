
import { useAuth, UserRoleEnum } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import PatientPrescriptionsView from '@/pages/PatientPrescriptionsView';
import { PrescriptionsView } from '@/components/prescriptions/PrescriptionsView';

/**
 * This route component determines how to display prescriptions
 * based on user role and parameters
 */
const PatientPrescriptionsRoute = () => {
  const { user, userRole } = useAuth();
  const { patientId } = useParams<{ patientId?: string }>();
  
  if (!user) return <Navigate to="/auth" replace />;
  
  // Always use PatientPrescriptionsView for patients to ensure consistent layout with dashboard
  if (userRole === UserRoleEnum.PATIENT) {
    return <PatientPrescriptionsView />;
  }
  
  // For doctors and other roles, use the full-width PrescriptionsView
  return <PrescriptionsView />;
};

export default PatientPrescriptionsRoute;
