
import React from 'react';
import { PatientAppLayout } from '@/layouts/PatientAppLayout';
import { AppLayout } from '@/layouts/AppLayout';
import UnderConstructionPage from '@/components/common/UnderConstructionPage';

const NewPrescriptionPage: React.FC = () => {
  return (
    <PatientAppLayout
      title="Prescriptions"
      description="View your prescriptions and recommendations"
      showHeader
      fullWidth={true}
    >
      <div className="w-full max-w-7xl mx-auto">
        <UnderConstructionPage 
          title="Prescriptions Coming Soon" 
          description="We're working on enhancing your prescription experience. Please check back soon!"
        />
      </div>
    </PatientAppLayout>
  );
};

export default NewPrescriptionPage;
