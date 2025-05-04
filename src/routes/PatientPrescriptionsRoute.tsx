
import { useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { PatientAppLayout } from '@/layouts/PatientAppLayout';
import { DoctorAppLayout } from '@/layouts/DoctorAppLayout';
import { AdminAppLayout } from '@/layouts/AdminAppLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { PrescriptionTabsViewer } from '@/components/prescriptions/PrescriptionTabsViewer';

/**
 * This route component shows patient prescriptions
 * using the same layout as the videos page
 */
const PatientPrescriptionsRoute = () => {
  const { user, userRole } = useAuth();
  const { patientId } = useParams();
  
  if (!user) return <Navigate to="/auth" replace />;
  
  // Use the current user's ID if no patientId is provided in the URL
  const effectivePatientId = patientId || user.id;
  
  // Function to render the appropriate layout based on user role
  const getLayout = (children: React.ReactNode) => {
    switch (userRole) {
      case "patient":
        return <PatientAppLayout showHeader title="Prescriptions" description="View and manage your prescriptions" fullWidth={true}>{children}</PatientAppLayout>;
      case "doctor":
        return <DoctorAppLayout showHeader title="Prescriptions" description="Manage patient prescriptions" fullWidth={true}>{children}</DoctorAppLayout>;
      case "administrator":
        return <AdminAppLayout showHeader title="Prescriptions" description="Oversee prescription system" fullWidth={true}>{children}</AdminAppLayout>;
      default:
        return <AppLayout>{children}</AppLayout>;
    }
  };
  
  return getLayout(
    <div className="w-full">
      <PrescriptionTabsViewer patientId={effectivePatientId} />
    </div>
  );
};

export default PatientPrescriptionsRoute;
