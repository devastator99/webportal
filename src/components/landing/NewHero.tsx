
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";

export const NewHero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4A2171] via-[#4A2171] to-[#2F3676] overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute w-[800px] h-[800px] left-[-300px] top-[-300px] bg-[#5E35B1]/10 rounded-full blur-[150px] animate-pulse-slow" />
      <div className="absolute w-[600px] h-[600px] right-[-200px] bottom-[-200px] bg-[#3949AB]/10 rounded-full blur-[120px] animate-pulse-slow" />
      
      {/* Hero content container */}
      <div className="container mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-between relative z-10">
        {/* Left content - Text and CTA */}
        <div className="w-full lg:w-1/2 mb-12 lg:mb-0 text-left">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-up">
            Your Health<br />
            Journey<br />
            Starts Here
          </h1>
          
          <p className="text-xl sm:text-2xl text-white/80 mb-8 max-w-lg animate-fade-up [animation-delay:200ms]">
            Experience personalized integrative medicine tailored to your unique health needs
          </p>
          
          <div className="flex flex-wrap gap-4 animate-fade-up [animation-delay:400ms]">
            {!user ? (
              <>
                <Button 
                  onClick={() => navigate("/auth")} 
                  className="bg-white hover:bg-white/90 text-[#4A2171] font-medium px-8 py-6 text-lg rounded-full flex items-center gap-2"
                >
                  Get Started <ArrowRight className="ml-1" size={18} />
                </Button>
                <Button 
                  onClick={() => navigate("/#features")} 
                  className="bg-transparent hover:bg-white/10 text-white border-2 border-white/30 font-medium px-8 py-6 text-lg rounded-full"
                >
                  Learn More
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-white hover:bg-white/90 text-[#4A2171] font-medium px-8 py-6 text-lg rounded-full flex items-center gap-2"
              >
                Dashboard <ArrowRight className="ml-1" size={18} />
              </Button>
            )}
          </div>
        </div>
        
        {/* Right content - App showcase */}
        <div className="w-full lg:w-1/2 relative h-[500px] hidden lg:block">
          {/* Main app UI mockup */}
          <div className="absolute top-0 right-0 w-[280px] shadow-xl rounded-xl overflow-hidden bg-black/90 border border-white/10 animate-float">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-[#00b8d4] mr-2"></div>
                  <div className="text-white/80 text-xs font-medium">AnubhootiHealth</div>
                </div>
                <div className="text-white/50 text-xs">9:41 AM</div>
              </div>
              
              <div className="text-white text-xl font-medium mb-3">Welcome back!</div>
              
              {/* Calendar widget */}
              <div className="bg-[#00b8d4] rounded-xl p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-white text-sm font-medium">April 2025</div>
                  <div className="text-white/70 text-xs">View All</div>
                </div>
                <div className="flex justify-between">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className={`text-center ${i === 2 ? 'bg-white rounded-md text-[#00b8d4]' : 'text-white'} px-2 py-1`}>
                      <div className="text-xs font-medium">{day}</div>
                      <div className="text-xs mt-1">{i + 24}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Stats card */}
              <div className="bg-[#5E35B1]/30 backdrop-blur-sm rounded-xl p-3 mb-4">
                <div className="text-white/90 text-sm mb-2">Today's Stats</div>
                <div className="flex justify-between">
                  <div className="text-center">
                    <div className="text-white text-lg font-medium">7.2k</div>
                    <div className="text-white/60 text-xs">Steps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white text-lg font-medium">6.3</div>
                    <div className="text-white/60 text-xs">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white text-lg font-medium">1.4k</div>
                    <div className="text-white/60 text-xs">Kcal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Supporting UI elements */}
          <div className="absolute top-[250px] right-[300px] w-[220px] h-[180px] bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg animate-float [animation-delay:300ms]"></div>
          <div className="absolute top-[100px] right-[260px] w-[180px] h-[160px] bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg animate-float [animation-delay:600ms]"></div>
          <div className="absolute bottom-0 right-[150px] w-[240px] h-[140px] bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg animate-float [animation-delay:900ms]"></div>
        </div>
      </div>
      
      {/* Floating element indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <span className="h-2 w-2 rounded-full bg-white/80"></span>
        <span className="h-2 w-2 rounded-full bg-white/40"></span>
        <span className="h-2 w-2 rounded-full bg-white/40"></span>
      </div>
    </div>
  );
};
