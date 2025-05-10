
import React from 'react';
import { Button } from '@/components/ui/button';
import '@/styles/glass.css';

interface CallToActionProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({ openAuthModal }) => {
  const handleStartClick = () => {
    if (openAuthModal) {
      openAuthModal('login'); // Changed from 'register' to 'login'
    }
  };
  
  return (
    <section className="py-16 bg-gradient-to-r from-purple-700 to-indigo-700 relative overflow-hidden">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card-dark p-8 rounded-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Start Your Wellness Journey Today</h2>
            <p className="text-lg mb-8 text-white/90">
              Join AnubhootiHealth and discover a personalized approach to your health and wellbeing, 
              combining modern medicine with time-tested healing traditions.
            </p>
            <Button
              size="lg"
              onClick={handleStartClick}
              className="bg-white hover:bg-gray-100 text-purple-700 text-lg px-8 py-6"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
