import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NoRoleWarning } from "@/components/auth/NoRoleWarning";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { NutritionistDashboard } from "@/components/dashboard/NutritionistDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ReceptionDashboard } from "@/components/dashboard/ReceptionDashboard";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AlternativeDashboard = () => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (!userRole) {
    return <NoRoleWarning onSignOut={signOut} />;
  }
  
  return (
    <div className="pt-16 md:pt-20">
      {(() => {
        switch (userRole) {
          case "doctor":
            return <DoctorDashboard />;
          case "patient":
            return <PatientDashboard />;
          case "nutritionist":
            return <NutritionistDashboard />;
          case "administrator":
            return <AdminDashboard />;
          case "reception":
            return <ReceptionDashboard />;
          default:
            return <NoRoleWarning onSignOut={signOut} />;
        }
      })()}
    </div>
  );
};

export default AlternativeDashboard;
