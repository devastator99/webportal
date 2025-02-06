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
import Admin from "./pages/Admin";
import { useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5]"></div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session state:", {
        hasSession: !!session,
        sessionUser: session?.user?.email,
        contextUser: user?.email,
        isLoading,
        timestamp: new Date().toISOString()
      });
    };
    
    checkSession();
  }, [user, isLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const ForceLogout = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const performLogout = async () => {
      if (isLoggingOut) return;
      
      setIsLoggingOut(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Force logout - Current session:", {
          hasSession: !!session,
          sessionUser: session?.user?.email,
          timestamp: new Date().toISOString()
        });

        await signOut();
        await supabase.auth.signOut(); // Explicit signout from Supabase
        
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      } catch (error) {
        console.error("Force logout error:", error);
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    performLogout();
  }, [signOut, toast, isLoggingOut]);

  return <LoadingSpinner />;
};

const AppRoutes = () => {
  const { user, isInitialized } = useAuth();
  const [needsForceLogout, setNeedsForceLogout] = useState(false);

  useEffect(() => {
    const checkAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("AppRoutes - Auth state check:", {
        hasSession: !!session,
        sessionUser: session?.user?.email,
        contextUser: user?.email,
        isInitialized,
        pathname: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    };

    checkAuthState();
  }, [user, isInitialized]);

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  if (needsForceLogout) {
    return <ForceLogout />;
  }

  return (
    <>
      <Navbar onForceLogout={() => setNeedsForceLogout(true)} />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/dashboard" replace /> : <Auth />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
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
  useEffect(() => {
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Initial app load - Session check:", {
        hasSession: !!session,
        sessionUser: session?.user?.email,
        pathname: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    };

    checkInitialSession();
  }, []);

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