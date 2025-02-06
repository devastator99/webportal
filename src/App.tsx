import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const LoadingSpinner = () => {
  console.log("LoadingSpinner rendered");
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5]"></div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  console.log("ProtectedRoute check:", { 
    user: user?.email, 
    isLoading,
    timestamp: new Date().toISOString()
  });

  if (isLoading) {
    console.log("ProtectedRoute: Loading state detected");
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log("ProtectedRoute: No user found, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  console.log("ProtectedRoute: User authenticated, rendering children");
  return <>{children}</>;
};

const ForceLogout = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log("Starting force logout process...", new Date().toISOString());
        await signOut();
        console.log("Logout successful", new Date().toISOString());
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      } catch (error) {
        console.error("Force logout error:", error, new Date().toISOString());
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    performLogout();
  }, [signOut, toast]);

  return null;
};

const AppRoutes = () => {
  const { user, isInitialized, isLoading } = useAuth();
  console.log("AppRoutes rendered", { 
    isInitialized, 
    isLoading,
    userEmail: user?.email,
    userId: user?.id,
    currentPath: window.location.pathname,
    timestamp: new Date().toISOString()
  });

  if (!isInitialized) {
    console.log("Auth not initialized yet, showing loading spinner");
    return <LoadingSpinner />;
  }

  return (
    <>
      <ForceLogout />
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route 
          path="/auth" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Auth />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log("App component rendered", {
    timestamp: new Date().toISOString(),
    pathname: window.location.pathname
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;