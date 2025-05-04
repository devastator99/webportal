
import { useAuth, UserRoleEnum } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import UnderConstructionPage from '@/components/common/UnderConstructionPage';
import { PatientAppLayout } from '@/layouts/PatientAppLayout';

/**
 * This route component shows an Under Construction page
 * replacing the previous prescriptions view
 */
const PatientPrescriptionsRoute = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/auth" replace />;
  
  return (
    <PatientAppLayout
      title="Prescriptions"
      description="Patient prescription management"
      showHeader
      fullWidth
    >
      <UnderConstructionPage 
        title="Prescriptions Coming Soon" 
        description="We're building an improved prescriptions experience for you."
      />
    </PatientAppLayout>
  );
};

export default PatientPrescriptionsRoute;
