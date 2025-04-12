
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NoRoleWarning } from "@/components/auth/NoRoleWarning";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { NutritionistDashboard } from "@/components/dashboard/NutritionistDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ReceptionDashboard } from "@/components/dashboard/ReceptionDashboard";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[Dashboard] useEffect triggered:", { 
      userId: user?.id, 
      userRole, 
      isLoading 
    });
    
    if (!isLoading && !user) {
      console.log("[Dashboard] No user found, redirecting to /auth");
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
    console.log("[Dashboard] Showing loading skeleton");
    return <DashboardSkeleton />;
  }

  // After loading, if no user is found, useEffect will handle redirect
  if (!user) {
    console.log("[Dashboard] No user, returning null");
    return null;
  }

  // Handle no role case
  if (!userRole) {
    console.log("[Dashboard] No role assigned, showing NoRoleWarning");
    return <NoRoleWarning onSignOut={signOut} />;
  }

  console.log(`[Dashboard] Rendering ${userRole} dashboard`);
  
  // IMPORTANT: Make sure to render the correct dashboard based on the role
  // Here we're ensuring that the PatientDashboard is rendered for patients
  return (
    <div className="pt-16 md:pt-20">
      {(() => {
        switch (userRole) {
          case "doctor":
            console.log("[Dashboard] Rendering doctor dashboard");
            return <DoctorDashboard />;
          case "patient":
            console.log("[Dashboard] Rendering patient dashboard");
            return <PatientDashboard />;
          case "nutritionist":
            console.log("[Dashboard] Rendering nutritionist dashboard");
            return <NutritionistDashboard />;
          case "administrator":
            console.log("[Dashboard] Rendering admin dashboard");
            return <AdminDashboard />;
          case "reception":
            console.log("[Dashboard] Rendering reception dashboard");
            return <ReceptionDashboard />;
          default:
            console.log(`[Dashboard] Invalid role: ${userRole}, rendering NoRoleWarning`);
            return <NoRoleWarning onSignOut={signOut} />;
        }
      })()}
    </div>
  );
};

export default Dashboard;
