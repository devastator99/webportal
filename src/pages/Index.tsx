import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-6xl md:text-7xl font-bold text-[#6E59A5] mb-8 animate-fade-up">
          Anubhuti
        </h1>
        <p className="text-xl md:text-2xl text-[#7E69AB] max-w-2xl mx-auto animate-fade-up">
          Expert Endocrinology Care Platform - Your path to better health starts here
        </p>
      </div>
    </div>
  );
}