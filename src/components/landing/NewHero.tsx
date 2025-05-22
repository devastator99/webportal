
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MobileAppMockup } from '../ui/MobileAppMockup';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '@/contexts/ResponsiveContext';

interface HeroSectionProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ openAuthModal }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  const handleStartClick = () => {
    if (openAuthModal) {
      openAuthModal('login');
    } else {
      navigate('/auth');
    }
  };
  
  return (
    <section 
      className="relative min-h-[85vh] sm:min-h-screen flex items-center pt-12 sm:pt-16 md:pt-20 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #4a2f80 0%, #6b46c1 100%)',
      }}
    >
      {/* Animated circles background - improved for mobile */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-purple-500 rounded-full opacity-20 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 sm:w-60 md:w-80 h-40 sm:h-60 md:h-80 bg-indigo-500 rounded-full opacity-20 blur-3xl animate-float-slow"></div>
        <div className="absolute top-3/4 left-3/4 w-24 sm:w-36 md:w-48 h-24 sm:h-36 md:h-48 bg-teal-500 rounded-full opacity-10 blur-3xl animate-float"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div 
            className={`w-full md:w-1/2 text-white text-center md:text-left mb-8 md:mb-0 ${isLoaded ? 'animate-fade-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.2s' }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              Your Health Journey<br />Starts Here
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-purple-200">
              Integrative medicine solutions powered by<br className="hidden md:block" /> AI and human expertise
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                size={isMobile ? "default" : "lg"} 
                onClick={handleStartClick}
                className="bg-white hover:bg-gray-100 text-purple-700 text-base w-full sm:w-auto px-6 sm:px-8"
              >
                Start Today
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size={isMobile ? "default" : "lg"}
                className="bg-purple-500 border-white text-white hover:bg-white/20 hover:text-white text-base w-full sm:w-auto px-6 sm:px-8"
              >
                Learn More
              </Button>
            </div>
          </div>
          
          <div 
            className={`w-full md:w-1/2 flex justify-center ${isLoaded ? 'animate-fade-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.4s' }}
          >
            <div className="w-3/4 sm:w-2/3 md:w-auto">
              <MobileAppMockup />
            </div>
          </div>
        </div>
      </div>
      
      {/* Wave shape at bottom - responsive */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none" className="w-full h-[50px] md:h-[100px]">
          <path 
            fill="#ffffff" 
            fillOpacity="1" 
            d="M0,64L120,69.3C240,75,480,85,720,80C960,75,1200,53,1320,42.7L1440,32L1440,100L1320,100C1200,100,960,100,720,100C480,100,240,100,120,100L0,100Z">
          </path>
        </svg>
      </div>
    </section>
  );
};
