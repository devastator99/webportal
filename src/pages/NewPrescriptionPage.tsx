
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { PatientAppLayout } from '@/layouts/PatientAppLayout';
import { DoctorAppLayout } from '@/layouts/DoctorAppLayout';
import { AdminAppLayout } from '@/layouts/AdminAppLayout';
import { AppLayout } from '@/layouts/AppLayout';
import UnderConstructionPage from '@/components/common/UnderConstructionPage';

const NewPrescriptionPage: React.FC = () => {
  const { userRole } = useAuth();

  // Function to render the appropriate layout based on user role
  const getLayout = (children: React.ReactNode) => {
    switch (userRole) {
      case "patient":
        return <PatientAppLayout showHeader title="Prescriptions" description="View your prescriptions and recommendations" fullWidth={true}>{children}</PatientAppLayout>;
      case "doctor":
        return <DoctorAppLayout showHeader title="Prescriptions" description="Create and manage patient prescriptions" fullWidth={true}>{children}</DoctorAppLayout>;
      case "administrator":
        return <AdminAppLayout showHeader title="Prescriptions" description="Manage system prescriptions" fullWidth={true}>{children}</AdminAppLayout>;
      default:
        return <AppLayout>{children}</AppLayout>;
    }
  };

  return getLayout(
    <div className="w-full max-w-7xl mx-auto">
      <UnderConstructionPage 
        title="Prescriptions Coming Soon" 
        description="We're working on enhancing your prescription experience. Please check back soon!"
      />
    </div>
  );
};

export default NewPrescriptionPage;
