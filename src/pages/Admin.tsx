
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Navbar } from "@/components/Navbar";

const Admin = () => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <>
        <Navbar />
        <DashboardSkeleton />
      </>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== "administrator") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Navbar />
      <AdminDashboard />
    </>
  );
};

export default Admin;
