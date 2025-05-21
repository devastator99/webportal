
import React from 'react';
import { Button } from '@/components/ui/button';
import '@/styles/glass.css';
import { useBreakpoint } from '@/hooks/use-responsive-layout';

interface CallToActionProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({ openAuthModal }) => {
  const { isSmallScreen } = useBreakpoint();
  
  const handleStartClick = () => {
    if (openAuthModal) {
      openAuthModal('login');
    }
  };
  
  return (
    <section className="py-12 md:py-20 bg-black text-white relative overflow-hidden">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-purple-900/10 backdrop-blur-sm"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glassmorphism-dark p-6 md:p-10 rounded-2xl">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-white">Start Your Wellness Journey Today</h2>
            <p className="text-base md:text-lg mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto">
              Join AnubhootiHealth and discover a personalized approach to your health and wellbeing, 
              combining modern medicine with time-tested healing traditions.
            </p>
            <Button
              size={isSmallScreen ? "default" : "lg"}
              onClick={handleStartClick}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-base md:text-lg px-6 md:px-8 py-2 md:py-6"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
