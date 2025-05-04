
import React from 'react';
import { PatientAppLayout } from '@/layouts/PatientAppLayout';
import { PrescriptionTabsViewer } from '@/components/prescriptions/PrescriptionTabsViewer';
import { useAuth } from '@/contexts/AuthContext';

const NewPrescriptionPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <PatientAppLayout
      title="Prescriptions"
      description="View your prescriptions and recommendations"
      showHeader
      fullWidth
    >
      <div className="w-full max-w-7xl mx-auto">
        {user?.id && <PrescriptionTabsViewer patientId={user.id} />}
      </div>
    </PatientAppLayout>
  );
};

export default NewPrescriptionPage;
