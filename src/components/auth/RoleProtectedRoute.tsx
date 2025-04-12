
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

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
  
  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // If no user is logged in, redirect to auth page
  if (!user) {
    console.log("RoleProtectedRoute: No user found, redirecting to", redirectTo);
    return <Navigate to={redirectTo} />;
  }
  
  // If user doesn't have required role, redirect to dashboard
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log("RoleProtectedRoute: User does not have required role, redirecting to dashboard");
    console.log("User role:", userRole, "Allowed roles:", allowedRoles);
    return <Navigate to="/dashboard" />;
  }
  
  // User has required role, render children
  return <>{children}</>;
};
