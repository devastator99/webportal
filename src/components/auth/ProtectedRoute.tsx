
import React, { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = "/auth" 
}) => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect patients specifically to the correct pages
  useEffect(() => {
    if (!isLoading && user && userRole === 'patient') {
      // If the patient is on any route they shouldn't access, redirect to chat
      const allowedPatientRoutes = ['/chat', '/prescriptions', '/habits', '/dashboard'];
      const isOnAllowedRoute = allowedPatientRoutes.some(route => 
        location.pathname === route || location.pathname.startsWith(`${route}/`)
      );
      
      if (!isOnAllowedRoute) {
        console.log("ProtectedRoute: Patient detected on restricted page, redirecting to chat");
        navigate('/chat', { replace: true });
      }
    }
  }, [user, userRole, isLoading, navigate, location.pathname]);
  
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
    return <Navigate to={redirectTo} />;
  }
  
  console.log("ProtectedRoute: User authenticated, rendering children");
  return <>{children}</>;
};
