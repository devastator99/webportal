
import React from 'react';
import { Button } from '@/components/ui/button';
import '@/styles/glass.css';

interface CallToActionProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({ openAuthModal }) => {
  const handleStartClick = () => {
    if (openAuthModal) {
      openAuthModal('login');
    }
  };
  
  return (
    <section className="py-20 bg-black text-white relative overflow-hidden">
      {/* Glassmorphism overlay with purple swirl effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-indigo-900/20 backdrop-blur-sm"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glassmorphism-dark p-8 md:p-10 rounded-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Start Your Wellness Journey Today</h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Join AnubhootiHealth and discover a personalized approach to your health and wellbeing, 
              combining modern medicine with time-tested healing traditions.
            </p>
            <Button
              size="lg"
              onClick={handleStartClick}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-lg px-8 py-6"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
