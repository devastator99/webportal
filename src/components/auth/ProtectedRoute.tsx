
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  
  // Effect to redirect patients specifically to /chat
  useEffect(() => {
    if (!isLoading && user && userRole === 'patient' && window.location.pathname !== '/chat') {
      console.log("ProtectedRoute: Patient detected on non-chat page, redirecting to chat");
      navigate('/chat', { replace: true });
    }
  }, [user, userRole, isLoading, navigate]);
  
  if (isLoading) {
    console.log("ProtectedRoute: Loading auth state");
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    console.log("ProtectedRoute: No user found, redirecting to auth page");
    return <Navigate to={redirectTo} />;
  }
  
  console.log("ProtectedRoute: User authenticated, rendering children");
  return <>{children}</>;
};
