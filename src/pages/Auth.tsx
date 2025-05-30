
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { LucideLoader2 } from "lucide-react";

const Auth = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const navigate = useNavigate();

  // ONLY redirect when we have BOTH user AND role - never redirect without a role
  useEffect(() => {
    const handleRedirect = async () => {
      // Don't redirect while still loading
      if (isLoading || isLoadingRole) {
        console.log("Auth page: Still loading, waiting...");
        return;
      }
      
      // CRITICAL: Only redirect if user has BOTH authentication AND a role
      // This prevents the infinite loop by ensuring role is fully loaded
      if (user && userRole) {
        console.log("Auth page: User has both auth and role, safe to redirect:", userRole);
        navigate("/dashboard", { replace: true });
        return;
      }
      
      // If user exists but no role, stay here and let registration complete
      if (user && !userRole) {
        console.log("Auth page: User authenticated but waiting for role creation");
        return;
      }
      
      // No user, stay on auth page
      console.log("Auth page: No user, staying on auth page");
    };
    
    handleRedirect();
  }, [user, userRole, isLoading, isLoadingRole, navigate]);

  // Show loading while anything is loading
  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">
          {isLoading ? "Loading authentication..." : "Setting up your account..."}
        </p>
      </div>
    );
  }

  // Show auth form - let users sign in/up and wait for role creation
  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          Welcome
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your account or create a new one
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          <SupabaseAuthUI 
            view="sign_in"
            redirectTo={`${window.location.origin}/auth`}
            showLinks={true}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
