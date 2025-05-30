
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { LucideLoader2 } from "lucide-react";

const Auth = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const navigate = useNavigate();

  // FIXED: Only redirect when BOTH user and role loading are complete
  // This prevents the redirect loop by ensuring we don't redirect to dashboard
  // before the role is properly loaded
  useEffect(() => {
    const handleRedirect = async () => {
      // Don't redirect while still loading either auth state or role
      if (isLoading || isLoadingRole) {
        console.log("Auth page: Still loading auth state or role, waiting...");
        return;
      }
      
      // Only redirect if user is authenticated AND has a role
      // This ensures we don't get into a loop where Dashboard redirects back here
      if (user && userRole) {
        console.log("Auth page: User has authentication and role, redirecting to dashboard:", userRole);
        navigate("/dashboard", { replace: true });
        return;
      }
      
      // If user exists but no role, stay on auth page
      // The registration process will handle role creation
      if (user && !userRole) {
        console.log("Auth page: User authenticated but no role yet, staying on auth page");
        return;
      }
      
      console.log("Auth page: User not authenticated, staying on auth page");
    };
    
    handleRedirect();
  }, [user, userRole, isLoading, isLoadingRole, navigate]);

  // Show loading state while auth or role is loading
  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  // Unified auth form for both login and registration
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
