
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
      className="relative min-h-[70vh] sm:min-h-[90vh] flex items-center pt-12 sm:pt-16 md:pt-20 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #4a2f80 0%, #6b46c1 100%)',
      }}
    >
      {/* Redesigned background with floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large purple gradient circle in the background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-purple-800 opacity-40 blur-3xl"></div>
        
        {/* Floating elements/icons */}
        <div className="absolute top-[20%] left-[15%] w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 border-2 rounded-2xl overflow-hidden animate-float">
          <div className="w-full h-full bg-purple-700 relative flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-full border-[6px] border-blue-400 relative">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/3 bg-blue-400 rounded-t-full"></div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-[40%] right-[15%] w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl border-2 overflow-hidden animate-float-slow">
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src="/lovable-uploads/e42732ca-e658-4992-8a2d-863555e56873.png" 
              alt="Doctor illustration" 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>
        
        <div className="absolute bottom-[30%] right-[25%] w-20 h-20 sm:w-24 sm:h-24 border-2 rounded-2xl overflow-hidden animate-float" style={{ animationDelay: '0.5s' }}>
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src="/lovable-uploads/5989b36b-4d21-46b9-9fee-38c13b8afdf3.png" 
              alt="Health activity illustration" 
              className="w-full h-full object-contain p-1" 
            />
          </div>
        </div>
        
        <div className="absolute top-[35%] left-[30%] w-20 h-20 sm:w-24 sm:h-24 border-2 rounded-2xl overflow-hidden animate-float-slow" style={{ animationDelay: '0.7s' }}>
          <div className="w-full h-full bg-purple-700 flex items-center justify-center">
            <div className="w-4/5 h-4/5 relative">
              <div className="absolute inset-0 bg-red-500 rounded-full overflow-hidden">
                <div className="absolute top-0 left-1/4 w-1/2 h-1/4 bg-green-500 rounded-full"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-yellow-400 rounded-md transform rotate-6"></div>
            </div>
          </div>
        </div>
        
        {/* Calendar element at bottom */}
        <div className="absolute bottom-0 left-[5%] w-48 h-16 sm:w-56 sm:h-20 overflow-hidden rounded-t-lg border-2 border-b-0">
          <div className="w-full h-full bg-cyan-500 grid grid-cols-5 text-center">
            {['25', '26', '27', '28', '29'].map((day, i) => (
              <div key={i} className="flex flex-col items-center justify-center text-white">
                {i % 2 === 1 && <span className="text-xs">★</span>}
                <span className="font-bold">{day}</span>
                <span className="text-xs">{['Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom mobile app menu bar */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-12 sm:w-72 sm:h-14 bg-black rounded-t-xl flex items-center px-4">
          <div className="mr-auto text-white">
            <div className="flex items-center">
              <div className="w-6 h-1 bg-white rounded-full mx-1"></div>
              <div className="w-6 h-1 bg-white rounded-full mx-1"></div>
              <div className="w-6 h-1 bg-white rounded-full mx-1"></div>
            </div>
          </div>
          <div className="ml-auto text-white font-semibold">
            AnubhootiHealth
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div 
            className={`w-full md:w-1/2 text-white text-center md:text-left mb-6 md:mb-0 ${isLoaded ? 'animate-fade-up' : 'opacity-0'}`}
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
            <div className="w-[55%] sm:w-[45%] md:w-[60%] lg:w-[50%] max-w-[280px]">
              {/* Mobile app mockup with reduced height */}
              <div className="relative bg-black rounded-3xl overflow-hidden border-4 border-[#333] shadow-2xl w-full">
                {/* Header - reduced padding */}
                <div className="p-1.5 sm:p-3 text-white">
                  <h3 className="text-center font-bold text-xs sm:text-sm">AnubhootiHealth</h3>
                  <p className="text-xs opacity-80 mt-0.5 sm:mt-1">Integrative Medicine solutions</p>
                  <h2 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1.5">Hi, Rakesh!</h2>
                </div>
                
                {/* Calendar row - reduced padding */}
                <div className="bg-[#00b5e2] text-white p-0.5 sm:p-2 flex justify-between items-center rounded-lg mx-1.5 sm:mx-3">
                  <div className="bg-white text-center p-0.5 rounded-md flex flex-col items-center min-w-[20px] sm:min-w-[32px]">
                    <span className="text-[0.4rem] sm:text-xs text-black">★</span>
                    <span className="text-xs sm:text-base font-bold text-black">24</span>
                    <span className="text-[0.4rem] sm:text-xs text-black">Mon</span>
                  </div>
                  
                  {['Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="text-center flex flex-col items-center">
                      {index === 1 || index === 3 ? <span className="text-[0.4rem] sm:text-xs">★</span> : <span className="text-[0.4rem] sm:text-xs opacity-0">·</span>}
                      <span className="text-[0.4rem] sm:text-xs font-medium">{25 + index}</span>
                      <span className="text-[0.4rem] sm:text-[0.4rem]">{day}</span>
                    </div>
                  ))}
                </div>
                
                {/* Progress section - reduced margins */}
                <div className="flex justify-between items-center my-1 sm:my-3 px-2 sm:px-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-[#8860f5] bg-transparent relative">
                      <div className="absolute inset-0 border-2 border-[#4cd770] rounded-full border-t-transparent border-r-transparent rotate-45"></div>
                    </div>
                    <div className="bg-[#4a7fff] h-0.5 sm:h-1 w-full mt-0.5 sm:mt-1 rounded-full"></div>
                  </div>
                  
                  <div className="w-10 sm:w-16 h-14 sm:h-20">
                    <img 
                      src="/lovable-uploads/e42732ca-e658-4992-8a2d-863555e56873.png" 
                      alt="Doctor avatar" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                
                {/* Features section - reduced padding and spacing */}
                <div className="py-1 sm:py-2 px-1 sm:px-3 space-y-1 sm:space-y-2">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="w-5 h-5 sm:w-8 sm:h-8">
                      <img 
                        src="/lovable-uploads/90f15a11-74d0-46f1-8b5f-38cb0b2595d4.png" 
                        alt="AI badge" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-white text-[0.5rem] sm:text-xs">AI Backed</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-8 sm:w-12 sm:h-12">
                      <img 
                        src="/lovable-uploads/e2178f5b-75e8-47aa-909a-2340b57758dd.png" 
                        alt="Activity" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col flex-1 items-end">
                      <div className="flex items-center gap-1">
                        <img 
                          src="/lovable-uploads/85c51479-e739-41cb-92db-1f9331c6e677.png" 
                          alt="Anubhooti Logo" 
                          className="w-3 h-3 sm:w-5 sm:h-5 object-contain"
                        />
                        <span className="text-white text-[0.5rem] sm:text-xs">AnubhootiHealth</span>
                      </div>
                      <div className="bg-[#4a7fff] text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full mt-0.5 sm:mt-1 w-full max-w-[100px] sm:max-w-[140px]"></div>
                    </div>
                  </div>
                  
                  {/* Chat section - reduced spacing */}
                  <div className="flex flex-col items-end space-y-0.5 sm:space-y-1">
                    <div className="bg-gray-200 text-transparent px-2 sm:px-4 py-1 sm:py-2 rounded-2xl w-full max-w-[100px] sm:max-w-[150px]">...</div>
                    <div className="flex items-center space-x-1">
                      <div className="bg-gray-400 text-transparent px-2 sm:px-4 py-1 sm:py-2 rounded-2xl flex-1">...</div>
                      <div className="bg-teal-400 text-white p-0.5 sm:p-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2 sm:w-3 sm:h-3">
                          <path d="M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256l-7.108-4.061C13.555 6.346 12 7.249 12 8.689v2.34L5.055 7.06z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wave shape at bottom - reduced height */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-[30px] md:h-[80px]">
          <path 
            fill="#ffffff" 
            fillOpacity="1" 
            d="M0,64L120,69.3C240,75,480,85,720,80C960,75,1200,53,1320,42.7L1440,32L1440,80L1320,80C1200,80,960,80,720,80C480,80,240,80,120,80L0,80Z">
          </path>
        </svg>
      </div>
    </section>
  );
};
