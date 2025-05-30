
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

const Auth = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);

  // Redirect logic for authenticated users
  useEffect(() => {
    console.log("Auth page: Current state:", { 
      hasUser: !!user, 
      userRole, 
      isLoading, 
      isLoadingRole
    });
    
    // Don't redirect while still loading
    if (isLoading || isLoadingRole) {
      console.log("Auth page: Still loading, waiting...");
      return;
    }
    
    // If user exists and has a role, redirect to dashboard
    if (user && userRole) {
      console.log("Auth page: User authenticated with role, redirecting to dashboard:", userRole);
      navigate("/dashboard", { replace: true });
      return;
    }
    
    // If user exists but no role, log the issue but don't redirect infinitely
    if (user && !userRole) {
      console.log("Auth page: User authenticated but no role found");
      return;
    }
    
    console.log("Auth page: No user, staying on auth page");
  }, [user, userRole, isLoading, isLoadingRole, navigate]);

  // Handle modal close - redirect to home page
  const handleModalClose = () => {
    setIsAuthModalOpen(false);
    navigate("/", { replace: true });
  };

  // Handle successful authentication - the useEffect above will handle redirect
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    // Let the useEffect handle the redirect based on auth state
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleModalClose}
        initialView="login"
      />
    </div>
  );
};

export default Auth;
