
import React from 'react';
import { Button } from '@/components/ui/button';

interface CallToActionProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({ openAuthModal }) => {
  const handleStartClick = () => {
    if (openAuthModal) {
      openAuthModal('register');
    }
  };
  
  return (
    <section className="py-16 bg-gradient-to-r from-purple-700 to-indigo-700">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Wellness Journey Today</h2>
          <p className="text-lg mb-8">
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
    </section>
  );
};
