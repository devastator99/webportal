
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const DashboardButton = () => {
  const navigate = useNavigate();
  const { resetInactivityTimer } = useAuth();

  return (
    <Button
      className="text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
      size="sm"
      variant="ghost"
      onClick={() => {
        resetInactivityTimer();
        navigate("/dashboard");
      }}
    >
      <LayoutDashboard className="h-4 w-4" />
      <span className="hidden sm:inline">Dashboard</span>
    </Button>
  );
};
