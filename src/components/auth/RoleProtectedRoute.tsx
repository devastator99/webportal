
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo = "/auth" 
}) => {
  const { user, userRole, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to={redirectTo} />;
  }
  
  // If no role found or role not in allowed roles, redirect to dashboard
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log("User role not allowed:", userRole, "Allowed roles:", allowedRoles);
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};
