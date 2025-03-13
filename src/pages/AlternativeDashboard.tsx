
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NoRoleWarning } from "@/components/auth/NoRoleWarning";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { AlternativeDoctorDashboard } from "@/components/dashboard/doctor/AlternativeDoctorDashboard";
import { NutritionistDashboard } from "@/components/dashboard/NutritionistDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ReceptionDashboard } from "@/components/dashboard/ReceptionDashboard";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

const AlternativeDashboard = () => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <>
        <Navbar />
        <DashboardSkeleton />
      </>
    );
  }

  // After loading, if no user is found, useEffect will handle redirect
  if (!user) {
    return null;
  }

  // Handle no role case
  if (!userRole) {
    return (
      <>
        <Navbar />
        <NoRoleWarning onSignOut={signOut} />
      </>
    );
  }
  
  // Render appropriate dashboard based on role with Navbar
  return (
    <>
      <Navbar />
      {(() => {
        switch (userRole) {
          case "doctor":
            return <AlternativeDoctorDashboard />;
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
    </>
  );
};

export default AlternativeDashboard;
