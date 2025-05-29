
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AdminAppLayout } from "@/layouts/AdminAppLayout";

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
    <AdminAppLayout>
      <AdminDashboard />
    </AdminAppLayout>
  );
};

export default Admin;
