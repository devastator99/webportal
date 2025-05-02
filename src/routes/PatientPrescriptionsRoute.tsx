
import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useParams } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PrescriptionTabsViewer } from "@/components/prescriptions/PrescriptionTabsViewer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PatientSidebar } from "@/components/dashboard/patient/PatientSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const PatientPrescriptionsRoute = () => {
  const { user, userRole, isLoading } = useAuth();
  const { patientId } = useParams();
  const isMobile = useIsMobile();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check user has proper permissions to view this prescription
  const hasAccess = userRole === "doctor" || 
                    userRole === "administrator" || 
                    (userRole === "patient" && user.id === patientId);
  
  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!patientId) {
    return <div>Patient ID is required</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {userRole === "patient" && <PatientSidebar />}
        <div className={`flex-1 ${isMobile ? "pb-20" : "pb-8"}`}>
          <div className={`container mx-auto pt-16 md:pt-20 ${isMobile ? "pb-24" : ""}`}>
            <PrescriptionTabsViewer patientId={patientId} className="!border-0 !shadow-none" />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PatientPrescriptionsRoute;
