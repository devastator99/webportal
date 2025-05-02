import { useAuth, UserRoleEnum } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import PatientPrescriptionsPage from '@/pages/PatientPrescriptionsPage';
import { PatientPageLayout } from '@/components/layout/PatientPageLayout';

/**
 * This route component determines how to display prescriptions
 * based on user role and parameters
 */
const PatientPrescriptionsRoute = () => {
  const { user, userRole } = useAuth();
  const { patientId } = useParams<{ patientId: string }>();
  
  if (!user) return <Navigate to="/auth" replace />;
  
  // If a patient is viewing their own prescriptions, we'll use the PatientPageLayout
  if (userRole === UserRoleEnum.PATIENT) {
    return (
      <PatientPageLayout
        title="My Prescriptions"
        description="View your medical prescriptions and medications"
      >
        <PatientPrescriptionsPage />
      </PatientPageLayout>
    );
  }
  
  // Otherwise, let the PatientPrescriptionsPage handle the layout
  return <PatientPrescriptionsPage />;
};

export default PatientPrescriptionsRoute;
