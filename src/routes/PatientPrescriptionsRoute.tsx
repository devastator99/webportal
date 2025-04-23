
import React from 'react';
import { PatientPrescriptions } from "@/components/dashboard/doctor/PatientPrescriptions";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

const PatientPrescriptionsRoute = () => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== "doctor") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="pt-16 md:pt-20">
      <div className="container mx-auto pb-6 px-6">
        <PatientPrescriptions />
      </div>
    </div>
  );
};

export default PatientPrescriptionsRoute;
