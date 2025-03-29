
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Logo = () => {
  const navigate = useNavigate();
  const { resetInactivityTimer } = useAuth();

  return (
    <div 
      className="text-xl sm:text-2xl font-bold text-[#9b87f5] cursor-pointer" 
      onClick={() => {
        resetInactivityTimer();
        navigate("/");
      }}
    >
      Anoobhooti
    </div>
  );
};
