
import { useAuth } from "@/contexts/AuthContext";
import { NoRoleWarning } from "@/components/auth/NoRoleWarning";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { NutritionistDashboard } from "@/components/dashboard/NutritionistDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ReceptionDashboard } from "@/components/dashboard/ReceptionDashboard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";

const Dashboard = () => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  console.log("Dashboard render:", { 
    user: user?.id, 
    userEmail: user?.email,
    userRole, 
    isLoading,
    hasAttemptedLoad
  });
  
  useEffect(() => {
    if (!isLoading) {
      setHasAttemptedLoad(true);
      
      if (!user) {
        console.log("No user found, redirecting to /");
        navigate("/");
      }
    }
  }, [user, isLoading, navigate]);

  // Show loading state, but only for a reasonable time
  if (isLoading && !hasAttemptedLoad) {
    console.log("Dashboard is loading...");
    return (
      <>
        <Navbar />
        <DashboardSkeleton />
      </>
    );
  }

  // After loading, if no user is found, useEffect will handle redirect
  if (!user) {
    console.log("Dashboard rendering null - no user");
    return null;
  }

  // Handle no role case
  if (!userRole) {
    console.log("Dashboard rendering NoRoleWarning - no role assigned");
    return (
      <>
        <Navbar />
        <NoRoleWarning onSignOut={signOut} />
      </>
    );
  }

  console.log(`Dashboard attempting to render ${userRole} dashboard`);
  
  // Render appropriate dashboard based on role with Navbar
  return (
    <>
      <Navbar />
      {(() => {
        switch (userRole) {
          case "doctor":
            console.log("Rendering doctor dashboard");
            return <DoctorDashboard />;
          case "patient":
            console.log("Rendering patient dashboard");
            return <PatientDashboard />;
          case "nutritionist":
            console.log("Rendering nutritionist dashboard");
            return <NutritionistDashboard />;
          case "administrator":
            console.log("Rendering admin dashboard");
            return <AdminDashboard />;
          case "reception":
            console.log("Rendering reception dashboard");
            return <ReceptionDashboard />;
          default:
            console.log(`Invalid role: ${userRole}, rendering NoRoleWarning`);
            return <NoRoleWarning onSignOut={signOut} />;
        }
      })()}
    </>
  );
};

export default Dashboard;
