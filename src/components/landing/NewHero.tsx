
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
            <img 
              src="/lovable-uploads/cb1900ec-74c6-4ca0-b563-86f81cd8f1df.png"
              alt="App Interface"
              className="absolute top-0 right-0 w-[300px] shadow-xl rounded-xl animate-fade-up"
            />
            <div className="absolute top-[40%] right-[320px] w-[250px] h-[200px] bg-white/10 backdrop-blur rounded-xl shadow-xl animate-fade-up [animation-delay:200ms]" />
            <div className="absolute bottom-0 right-[150px] w-[250px] h-[200px] bg-white/10 backdrop-blur rounded-xl shadow-xl animate-fade-up [animation-delay:400ms]" />
          </div>
        </div>
      </div>
    </div>
  );
};
