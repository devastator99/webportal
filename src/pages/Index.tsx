import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    console.log("[Index] Navigating to auth page");
    navigate("/auth", { replace: true });
  };

  // Redirect authenticated users to dashboard
  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-[#6E59A5] mb-6 animate-fade-up">
          Anubhuti
        </h1>
        <p className="text-xl md:text-2xl text-[#7E69AB] mb-8 max-w-2xl animate-fade-up">
          Expert Endocrinology Care Platform - Your path to better health starts here
        </p>
        <div className="space-y-4 animate-fade-up">
          <Button 
            onClick={handleGetStarted}
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white px-8 py-6 text-lg flex items-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}