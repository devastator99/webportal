
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface JourneySectionProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const JourneySection: React.FC<JourneySectionProps> = ({ openAuthModal }) => {
  const handleStartJourneyClick = () => {
    if (openAuthModal) {
      openAuthModal('register');
    }
  };
  
  return (
    <section className="py-16 bg-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[#7E69AB]">Your Health Journey</h2>
          
          {/* Journey timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#F5F1FF] p-6 rounded-xl">
              <div className="w-12 h-12 flex items-center justify-center bg-[#9b87f5] text-white rounded-full mb-4 font-bold text-xl">1</div>
              <h3 className="text-xl font-semibold mb-2 text-[#7E69AB]">Connect</h3>
              <p className="text-gray-600">Join our platform and connect with experienced healthcare professionals who understand your needs.</p>
            </div>
            
            <div className="bg-[#F5F1FF] p-6 rounded-xl">
              <div className="w-12 h-12 flex items-center justify-center bg-[#9b87f5] text-white rounded-full mb-4 font-bold text-xl">2</div>
              <h3 className="text-xl font-semibold mb-2 text-[#7E69AB]">Personalize</h3>
              <p className="text-gray-600">Receive a personalized health plan tailored to your specific conditions and lifestyle.</p>
            </div>
            
            <div className="bg-[#F5F1FF] p-6 rounded-xl">
              <div className="w-12 h-12 flex items-center justify-center bg-[#9b87f5] text-white rounded-full mb-4 font-bold text-xl">3</div>
              <h3 className="text-xl font-semibold mb-2 text-[#7E69AB]">Transform</h3>
              <p className="text-gray-600">Follow your plan with ongoing support and see meaningful improvements in your health.</p>
            </div>
          </div>
          
          {/* CTA button */}
          <div className="text-center">
            <Button
              onClick={handleStartJourneyClick}
              className="bg-[#9b87f5] hover:bg-[#8a78e4] text-white px-8 py-6 rounded-full text-lg"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
