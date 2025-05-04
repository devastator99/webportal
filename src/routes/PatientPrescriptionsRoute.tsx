
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
  const { patientId } = useParams<{ patientId: string }>();
  
  if (!user) return <Navigate to="/auth" replace />;
  
  // If a patient is viewing prescriptions (either their own or someone else's)
  // we'll use the PatientPrescriptionsPage component which has the correct layout
  if (userRole === UserRoleEnum.PATIENT) {
    return <PatientPrescriptionsPage />;
  }
  
  // For doctors and other roles, return the centralized prescriptions view
  return <PrescriptionsView />;
};

export default PatientPrescriptionsRoute;
