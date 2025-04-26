
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const NewHero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F6F8FD] to-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[140%] h-[140%] bg-[#E5DEFF] rounded-full opacity-50 blur-3xl" />
        <div className="absolute top-[20%] -right-[30%] w-[140%] h-[140%] bg-[#FFE8F0] rounded-full opacity-50 blur-3xl" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#7E69AB] to-[#9b87f5] bg-clip-text text-transparent animate-fade-up">
            Modern Healthcare for Today's World
          </h1>
          <p className="text-lg md:text-xl text-[#6E59A5] mb-8 max-w-2xl mx-auto animate-fade-up [animation-delay:200ms]">
            Experience healthcare reimagined with our innovative platform that connects patients with doctors seamlessly
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up [animation-delay:400ms]">
            {!user && (
              <Button
                onClick={() => navigate("/auth")}
                className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white px-8 py-6 rounded-full text-lg transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/about")}
              className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] px-8 py-6 rounded-full text-lg transition-all duration-300"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
