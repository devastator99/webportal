
import React from 'react';
import { Button } from '@/components/ui/button';
import '@/styles/glass.css';
import { useBreakpoint } from '@/hooks/use-responsive-layout';

interface CallToActionProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({
  openAuthModal
}) => {
  const {
    isSmallScreen
  } = useBreakpoint();
  
  const handleStartClick = () => {
    if (openAuthModal) {
      openAuthModal('login');
    }
  };
  
  return (
    <section className="py-24 bg-gradient-to-br from-purple-800 to-indigo-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
      <div className="glassmorphism-container absolute inset-0 overflow-hidden">
        <div className="glassmorphism-circle opacity-20 bg-gradient-to-br from-purple-400 to-indigo-400 top-1/4 -left-[10%]"></div>
        <div className="glassmorphism-circle opacity-20 bg-gradient-to-br from-blue-400 to-indigo-400 bottom-1/4 -right-[10%]"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to begin your journey towards holistic health?
          </h2>
          <p className="text-xl md:text-2xl text-indigo-200 mb-10 max-w-3xl mx-auto">
            Start transforming your health today with our integrated care approach that combines modern medicine and traditional wisdom.
          </p>
          <Button 
            size={isSmallScreen ? "default" : "lg"}
            onClick={handleStartClick} 
            className="bg-white text-indigo-900 hover:bg-indigo-100 font-medium text-lg px-8"
          >
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
};
