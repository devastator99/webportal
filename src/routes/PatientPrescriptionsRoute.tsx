
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import { PatientAppLayout } from '@/layouts/PatientAppLayout';
import { PrescriptionTabsViewer } from '@/components/prescriptions/PrescriptionTabsViewer';

/**
 * This route component shows patient prescriptions
 * using the same layout as the videos page
 */
const PatientPrescriptionsRoute = () => {
  const { user } = useAuth();
  const { patientId } = useParams();
  
  if (!user) return <Navigate to="/auth" replace />;
  
  // Use the current user's ID if no patientId is provided in the URL
  const effectivePatientId = patientId || user.id;
  
  return (
    <PatientAppLayout
      title="Prescriptions"
      description="View and manage your prescriptions"
      showHeader
      fullWidth
    >
      <div className="w-full">
        <PrescriptionTabsViewer patientId={effectivePatientId} />
      </div>
    </PatientAppLayout>
  );
};

export default PatientPrescriptionsRoute;
