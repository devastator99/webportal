
import React from 'react';
import { PatientAppLayout } from '@/layouts/PatientAppLayout';
import UnderConstructionPage from '@/components/common/UnderConstructionPage';

const NewPrescriptionPage: React.FC = () => {
  return (
    <PatientAppLayout
      title="New Prescription"
      description="Create a new prescription"
      showHeader
      fullWidth
    >
      <UnderConstructionPage 
        title="New Prescription Feature Coming Soon" 
        description="We're working on building a new prescription creation feature. Stay tuned!" 
      />
    </PatientAppLayout>
  );
};

export default NewPrescriptionPage;
