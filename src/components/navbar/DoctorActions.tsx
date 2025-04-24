
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, UserRoleEnum } from "@/contexts/AuthContext";

export const DoctorActions = () => {
  const { userRole, resetInactivityTimer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isPatientsPage = location.pathname === '/patients';

  if (userRole !== UserRoleEnum.DOCTOR) return null;
  
  return (
    <>
      {!isPatientsPage && (
        <Button 
          className="text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
          size="sm"
          variant="ghost"
          onClick={() => {
            resetInactivityTimer();
            navigate("/patients");
          }}
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Patients</span>
        </Button>
      )}
    </>
  );
};
