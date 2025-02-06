
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default function Admin() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && (!user || user?.role !== 'administrator')) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleForceSignOut = async () => {
    try {
      console.log("Force sign out initiated", {
        timestamp: new Date().toISOString(),
        beforeClear: {
          localStorageKeys: Object.keys(localStorage),
          sessionStorageKeys: Object.keys(sessionStorage)
        }
      });
      
      localStorage.clear();
      sessionStorage.clear();
      
      console.log("Storage cleared", {
        afterClear: {
          localStorageKeys: Object.keys(localStorage),
          sessionStorageKeys: Object.keys(sessionStorage)
        }
      });
      
      await signOut();
      
      toast({
        title: "Signed out successfully",
        description: "You have been forcefully signed out.",
      });
      
      window.location.reload();
    } catch (error) {
      console.error("Force sign out error:", error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Force Sign Out button */}
      <div className="fixed top-20 right-4 z-[9999] bg-destructive rounded-md shadow-lg">
        <Button 
          variant="destructive"
          onClick={handleForceSignOut}
          className="flex items-center gap-2 !bg-destructive hover:!bg-destructive/90"
        >
          <LogOut className="h-4 w-4" />
          Force Sign Out
        </Button>
      </div>

      <AdminDashboard />
    </div>
  );
}
