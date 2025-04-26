
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Logo = () => {
  const navigate = useNavigate();
  const { resetInactivityTimer } = useAuth();

  return (
    <div 
      className="flex items-center cursor-pointer" 
      onClick={() => {
        resetInactivityTimer();
        navigate("/");
      }}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mr-3"></div>
      <div className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">
        Anoobhooti
      </div>
    </div>
  );
};
