
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const NewHero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center bg-gradient-to-br from-[#4A2171] via-[#4A2171] to-[#2F3676] overflow-hidden">
      {/* Background floating elements */}
      <div className="absolute w-[600px] h-[600px] right-[-100px] top-[-100px] bg-[#5E35B1]/20 rounded-full blur-3xl" />
      <div className="absolute w-[600px] h-[600px] right-[-200px] bottom-[-200px] bg-[#3949AB]/20 rounded-full blur-3xl" />
      
      {/* Main content */}
      <div className="container mx-auto px-6 relative z-10 py-20">
        <div className="max-w-3xl">
          <h1 className="text-6xl sm:text-7xl font-bold text-white mb-6 leading-tight animate-fade-up">
            Your Health Journey
            <br />
            Starts Here
          </h1>
          <p className="text-xl sm:text-2xl text-white/80 mb-8 animate-fade-up [animation-delay:200ms]">
            Integrative medicine solutions
          </p>
          <div className="flex gap-4 animate-fade-up [animation-delay:400ms]">
            {!user && (
              <Button
                onClick={() => navigate("/auth")}
                className="bg-black hover:bg-black/90 text-white px-8 py-6 text-lg rounded-full"
              >
                Start Today
              </Button>
            )}
          </div>
        </div>

        {/* Floating app screenshots */}
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 hidden lg:block">
          <div className="relative w-[600px] h-[600px]">
            {/* Main app screenshot */}
            <div className="absolute top-0 right-0 w-[300px] shadow-xl rounded-xl bg-black animate-fade-up animate-float">
              <div className="p-4">
                <div className="mb-1 flex justify-between">
                  <div className="h-1"></div>
                  <div className="text-white text-xs">AnubhootiHealth</div>
                </div>
                <div className="text-white/70 text-xs mb-2">Integrative Medicine solutions</div>
                <div className="text-white text-xl mb-3">Hi, Rakesh!</div>
                
                {/* Calendar widget */}
                <div className="bg-[#00b8d4] rounded-xl p-2 flex justify-between mb-4">
                  <div className="bg-[#00b8d4] rounded-lg px-2 py-1 text-white text-center border-[1px] border-white/40">
                    <div className="text-xs">24</div>
                    <div className="text-[10px]">Mon</div>
                  </div>
                  <div className="px-2 py-1 text-white text-center">
                    <div className="text-xs">25</div>
                    <div className="text-[10px]">Tue</div>
                  </div>
                  <div className="px-2 py-1 text-white text-center">
                    <div className="text-xs">26</div>
                    <div className="text-[10px]">Wed</div>
                  </div>
                  <div className="px-2 py-1 text-white text-center">
                    <div className="text-xs">27</div>
                    <div className="text-[10px]">Thu</div>
                  </div>
                  <div className="px-2 py-1 text-white text-center">
                    <div className="text-xs">28</div>
                    <div className="text-[10px]">Fri</div>
                  </div>
                  <div className="px-2 py-1 text-white text-center">
                    <div className="text-xs">29</div>
                    <div className="text-[10px]">Sat</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating UI elements */}
            <div className="absolute top-[40%] right-[320px] w-[250px] h-[200px] bg-white/10 backdrop-blur rounded-xl shadow-xl animate-fade-up [animation-delay:200ms] animate-float" />
            <div className="absolute bottom-0 right-[150px] w-[250px] h-[200px] bg-white/10 backdrop-blur rounded-xl shadow-xl animate-fade-up [animation-delay:400ms] animate-float" />
          </div>
        </div>
      </div>
    </div>
  );
};
