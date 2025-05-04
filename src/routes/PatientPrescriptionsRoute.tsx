
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import UnderConstructionPage from '@/components/common/UnderConstructionPage';
import { DashboardResponsiveLayout } from '@/components/layout/DashboardResponsiveLayout';

/**
 * This route component shows an Under Construction page
 * replacing the previous prescriptions view
 */
const PatientPrescriptionsRoute = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/auth" replace />;
  
  return (
    <DashboardResponsiveLayout fullHeight withPadding={false}>
      <UnderConstructionPage 
        title="Prescriptions Coming Soon" 
        description="We're building an improved prescriptions experience for you."
      />
    </DashboardResponsiveLayout>
  );
};

export default PatientPrescriptionsRoute;
