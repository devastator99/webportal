
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { MobileAppMockup } from '../ui/MobileAppMockup';

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
    <section className="py-16 bg-black text-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Your Journey at AnubhootiHealth</h2>
        </div>
        
        {/* Journey timeline with vertical line */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative">
          {/* Center vertical line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white transform -translate-x-1/2"></div>
          
          {/* Left content - Doctor + AI Section */}
          <div className="flex flex-col items-end relative">
            <div className="md:max-w-md">
              <p className="text-lg text-white/80 mb-4">
                Doctor, dietitian, psychologist & AI—<br />
                all in one seamless conversation.
              </p>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Personalized Care, Powered by People & AI
              </h3>
            </div>
          </div>
          
          {/* Right content - App mockup */}
          <div className="flex justify-center md:justify-start">
            <MobileAppMockup />
          </div>
          
          {/* Circle timeline indicator 1 */}
          <div className="hidden md:flex absolute left-1/2 top-24 transform -translate-x-1/2 z-20">
            <div className="w-16 h-16 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center">
              <img 
                src="/lovable-uploads/e42732ca-e658-4992-8a2d-863555e56873.png" 
                alt="Avatar" 
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
          </div>
          
          {/* Left content - App mockup with calendar */}
          <div className="flex justify-end md:justify-end mt-16">
            <div className="relative">
              <img 
                className="rounded-2xl"
                src="/lovable-uploads/90f15a11-74d0-46f1-8b5f-38cb0b2595d4.png" 
                alt="Person with tracking app" 
              />
              <div className="absolute -bottom-8 -right-8 bg-cyan-400 rounded-xl p-2 text-black">
                <div className="flex space-x-1 text-xs">
                  {[24, 25, 26, 27, 28, 29].map((day, i) => (
                    <div key={i} className={`flex flex-col items-center text-center p-1 ${i === 2 ? 'bg-white rounded-md' : ''}`}>
                      <div className="text-[10px]">{day}</div>
                      <div className="text-[8px]">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right content - Track What Matters */}
          <div className="flex flex-col items-start relative mt-16">
            <div className="md:max-w-md">
              <p className="text-lg text-white/80 mb-4">
                Habit tracker with deep insights<br />
                to turn effort into real change.
              </p>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Track What Matters, Change What Counts
              </h3>
            </div>
          </div>
          
          {/* Circle timeline indicator 2 */}
          <div className="hidden md:flex absolute left-1/2 top-[45%] transform -translate-x-1/2 z-20">
            <div className="w-16 h-16 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center">
              <img 
                src="/lovable-uploads/e42732ca-e658-4992-8a2d-863555e56873.png" 
                alt="Avatar" 
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
          </div>
          
          {/* Left content - Science section */}
          <div className="flex flex-col items-end mt-16">
            <div className="md:max-w-md">
              <p className="text-lg text-white/80 mb-4">
                From band-aids to breakthroughs.
              </p>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Holistic, Science-Backed Transformation
              </h3>
            </div>
          </div>
          
          {/* Right content - Science image */}
          <div className="flex justify-start mt-16">
            <img 
              className="rounded-2xl"
              src="/lovable-uploads/5f247b72-d914-4715-b86f-3c4be3b90ea8.png" 
              alt="Medical research" 
            />
          </div>
          
          {/* Circle timeline indicator 3 */}
          <div className="hidden md:flex absolute left-1/2 top-[75%] transform -translate-x-1/2 z-20">
            <div className="w-16 h-16 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center">
              <img 
                src="/lovable-uploads/e42732ca-e658-4992-8a2d-863555e56873.png" 
                alt="Avatar" 
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
          </div>
        </div>
        
        {/* CTA button */}
        <div className="text-center mt-16">
          <Button
            onClick={handleStartJourneyClick}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-6 rounded-full text-lg"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
