
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
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";

const Dashboard = () => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("Dashboard render:", { 
    user: user?.id, 
    userEmail: user?.email,
    userRole, 
    isLoading 
  });

  useEffect(() => {
    console.log("[Dashboard] useEffect triggered:", { 
      userId: user?.id, 
      userRole, 
      isLoading 
    });
    
    if (!isLoading && !user) {
      console.log("[Dashboard] No user found, redirecting to /");
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
    console.log("[Dashboard] Showing loading skeleton");
    return (
      <>
        <Navbar />
        <DashboardSkeleton />
      </>
    );
  }

  // After loading, if no user is found, useEffect will handle redirect
  if (!user) {
    console.log("[Dashboard] No user, returning null");
    return null;
  }

  // Handle no role case
  if (!userRole) {
    console.log("[Dashboard] No role assigned, showing NoRoleWarning");
    return (
      <>
        <Navbar />
        <NoRoleWarning onSignOut={signOut} />
      </>
    );
  }

  console.log(`[Dashboard] Attempting to render ${userRole} dashboard`);
  
  // Render appropriate dashboard based on role with Navbar
  return (
    <>
      <Navbar />
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
    </>
  );
};

export default Dashboard;
