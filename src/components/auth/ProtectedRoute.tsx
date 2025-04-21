
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
  
  // Redirect patients specifically to /chat immediately when component loads
  useEffect(() => {
    if (!isLoading && user && userRole === 'patient' && location.pathname !== '/chat') {
      console.log("ProtectedRoute: Patient detected on non-chat page, redirecting to chat");
      navigate('/chat', { replace: true });
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
  
  // Check again for patient on non-chat page (immediate redirect)
  if (userRole === 'patient' && location.pathname !== '/chat') {
    console.log("ProtectedRoute: Patient on non-chat page, immediate redirect");
    return <Navigate to="/chat" replace />;
  }
  
  console.log("ProtectedRoute: User authenticated, rendering children");
  return <>{children}</>;
};
