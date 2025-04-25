
import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useParams } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PrescriptionTabsViewer } from "@/components/prescriptions/PrescriptionTabsViewer";

const PatientPrescriptionsRoute = () => {
  const { user, userRole, isLoading } = useAuth();
  const { patientId } = useParams();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== "doctor") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!patientId) {
    return <div>Patient ID is required</div>;
  }

  return (
    <div className="pt-16 md:pt-20">
      <div className="container mx-auto pb-6 px-6">
        <PrescriptionTabsViewer patientId={patientId} />
      </div>
    </div>
  );
};

export default PatientPrescriptionsRoute;
