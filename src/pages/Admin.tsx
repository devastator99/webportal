
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

const Admin = () => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== "administrator") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="pt-16 md:pt-20">
      <AdminDashboard />
    </div>
  );
};

export default Admin;
