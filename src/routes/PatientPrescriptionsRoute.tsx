
import { useAuth, UserRoleEnum } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import PatientPrescriptionsPage from '@/pages/PatientPrescriptionsPage';
import { PrescriptionsView } from '@/components/prescriptions/PrescriptionsView';

/**
 * This route component determines how to display prescriptions
 * based on user role and parameters
 */
const PatientPrescriptionsRoute = () => {
  const { user, userRole } = useAuth();
  const { patientId } = useParams<{ patientId?: string }>();
  
  if (!user) return <Navigate to="/auth" replace />;
  
  // If a patient is viewing prescriptions, always use PatientPrescriptionsPage 
  // which has the correct patient layout with sidebar
  if (userRole === UserRoleEnum.PATIENT) {
    return <PatientPrescriptionsPage />;
  }
  
  // For doctors and other roles, return the centralized prescriptions view
  // The prescriptions view will handle getting the patientId from params
  return <PrescriptionsView />;
};

export default PatientPrescriptionsRoute;
