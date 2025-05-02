
import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useParams } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PrescriptionTabsViewer } from "@/components/prescriptions/PrescriptionTabsViewer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PatientSidebar } from "@/components/dashboard/patient/PatientSidebar";
import { useIsMobile, useIsMobileOrIPad } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";

const PatientPrescriptionsRoute = () => {
  const { user, userRole, isLoading } = useAuth();
  const { patientId } = useParams();
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrIPad();

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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-50 to-indigo-50">
        {userRole === "patient" && <PatientSidebar />}
        <motion.div 
          className={`flex-1 ${isMobileOrTablet ? "pb-20" : "pb-8"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className={`container mx-auto pt-16 md:pt-20 ${isMobileOrTablet ? "pb-24" : ""}`}>
            <PrescriptionTabsViewer patientId={patientId} className="!border-0 !shadow-lg" />
          </div>
        </motion.div>
        {isMobileOrTablet && <MobileNavigation />}
      </div>
    </SidebarProvider>
  );
};

export default PatientPrescriptionsRoute;
