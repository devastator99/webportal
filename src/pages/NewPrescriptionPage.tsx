
import { useAuth } from "@/contexts/AuthContext";
import { PatientAppLayout } from '@/layouts/PatientAppLayout';
import { DoctorAppLayout } from '@/layouts/DoctorAppLayout';
import { AdminAppLayout } from '@/layouts/AdminAppLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { PrescriptionWriter } from '@/components/dashboard/doctor/PrescriptionWriter';

const NewPrescriptionPage: React.FC = () => {
  const { userRole } = useAuth();

  // Function to render the appropriate layout based on user role
  const getLayout = (children: React.ReactNode) => {
    switch (userRole) {
      case "patient":
        return <PatientAppLayout showHeader title="Prescriptions" description="View your prescriptions and recommendations" fullWidth={true}>{children}</PatientAppLayout>;
      case "doctor":
        return <DoctorAppLayout showHeader title="New Prescription" description="Create and manage patient prescriptions" fullWidth={true}>{children}</DoctorAppLayout>;
      case "administrator":
        return <AdminAppLayout showHeader title="Prescriptions" description="Manage system prescriptions" fullWidth={true}>{children}</AdminAppLayout>;
      default:
        return <AppLayout>{children}</AppLayout>;
    }
  };

  return getLayout(
    <ContentContainer>
      <PrescriptionWriter />
    </ContentContainer>
  );
};

export default NewPrescriptionPage;
