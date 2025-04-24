
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

export const LoginDialog = () => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate("/auth")}
      variant="outline"
      className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] gap-2 font-medium shadow-sm"
      size="sm"
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Sign In</span>
      <span className="sm:hidden">Login</span>
    </Button>
  );
};
