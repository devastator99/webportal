
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = "/auth" 
}) => {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();
  
  // Enhanced logging for better debugging
  useEffect(() => {
    console.log("ProtectedRoute: user, userRole, isLoading:", {
      userId: user?.id,
      userEmail: user?.email,
      userRole,
      isLoading,
      pathname: location.pathname
    });
  }, [user, userRole, isLoading, location.pathname]);
  
  // When still loading, show spinner
  if (isLoading) {
    console.log("ProtectedRoute: Loading auth state");
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // If no user, redirect to auth page
  if (!user) {
    console.log("ProtectedRoute: No user found, redirecting to auth page");
    toast.error("You need to be signed in to access this page");
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }
  
  console.log("ProtectedRoute: User authenticated, rendering children");
  return <>{children}</>;
};
