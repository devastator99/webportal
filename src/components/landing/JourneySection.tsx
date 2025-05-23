import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { MobileAppMockup } from '../ui/MobileAppMockup';
import { useResponsive } from '@/contexts/ResponsiveContext';
interface JourneySectionProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}
export const JourneySection: React.FC<JourneySectionProps> = ({
  openAuthModal
}) => {
  const {
    isMobile,
    isTablet
  } = useResponsive();
  const handleStartJourneyClick = () => {
    if (openAuthModal) {
      openAuthModal('register');
    }
  };
  return <section className="py-12 lg:py-20 bg-black text-white relative overflow-hidden md:py-[10px]">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Your Journey at AnubhootiHealth</h2>
        </div>
        
        {/* Journey timeline - adaptive for mobile */}
        <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-2 md:gap-16 relative">
          {/* Center vertical line - only visible on desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white transform -translate-x-1/2"></div>
          
          {/* Timeline indicator 1 - desktop only - MOVED TO TOP */}
          <div className="hidden md:flex absolute left-1/2 top-0 transform -translate-x-1/2 z-20">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center">
              <img alt="Indian woman profile" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover" src="/lovable-uploads/ac9a591b-754c-4692-a8da-d7ef58837b8c.jpg" />
            </div>
          </div>
          
          {/* Section 1: Doctor + AI */}
          <div className="flex flex-col items-center md:items-end relative">
            <div className="md:max-w-md md:ml-auto md:-mt-6 my-[124px]">
              <p className="text-lg text-white/80 mb-4">
                Doctor, dietitian, psychologist & AI—<br />
                all in one seamless conversation.
              </p>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
                Personalized Care, Powered by People & AI
              </h3>
            </div>
          </div>
          
          {/* Section 1: One Chat, Full Care image - opposite to App mockup */}
          <div className="flex flex-col items-center md:items-start relative my-[90px]">
            <div className="md:max-w-md md:ml-0 md:-mt-6 my-[60px]">
              <div className="bg-black p-4 rounded-lg shadow-lg">
                <img alt="One Chat, Full Care" className="w-full rounded-lg shadow-inner" src="/lovable-uploads/c9b90fb3-4128-4609-95e2-034a337fd747.png" />
              </div>
            </div>
          </div>
          
          {/* Section 1: App mockup */}
          <div className="flex justify-center md:justify-start order-last md:order-none">
            <div className="w-3/4 sm:w-2/3 md:w-auto my-0">
              <MobileAppMockup />
            </div>
          </div>
          
          {/* New placeholder divs opposite to mobile app mockup */}
          <div className="hidden md:flex flex-col items-center md:items-end justify-center h-full">
            <div className="bg-gray-800/50 rounded-lg p-6 w-full max-w-md h-[200px] mb-4 flex items-center justify-center border border-gray-700">
              <img src="/lovable-uploads/db68319f-f13b-49ea-b9e2-bec967f25077.png" alt="One Chat, Full Care" className="w-full h-auto object-contain" />
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 w-full max-w-md h-[200px] flex items-center justify-center border border-gray-700">
              <p className="text-gray-400 text-center">Placeholder Content</p>
            </div>
          </div>
          
          {/* Mobile timeline indicator 1 */}
          <div className="flex md:hidden justify-center my-4">
            <div className="w-12 h-12 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center">
              <img src="/lovable-uploads/7d10a697-4563-40b0-801b-377284ce6c97.png" alt="Indian woman profile" className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
          
          {/* Section 2: Calendar tracking - responsive layout reversal on mobile */}
          <div className="md:col-start-1 md:col-end-2 md:row-start-3 flex justify-center md:justify-end">
            <div className="relative max-w-[80%] sm:max-w-[70%] md:max-w-none">
              {/* Added new image to this div */}
              <img alt="Woman eating healthy salad with chat interface" className="rounded-lg shadow-lg w-full object-cover" src="/lovable-uploads/ec9a47d5-3b80-4ed5-80e9-73f8c4c8cf85.png" />
              
              
            </div>
          </div>
          
          {/* Section 2: Track What Matters */}
          <div className="md:col-start-2 md:col-end-3 md:row-start-3 flex flex-col items-center md:items-start relative py-2 md:py-0">
            <div className="md:max-w-md md:ml-auto md:-mt-3 my-[60px]">
              <p className="text-lg text-white/80 mb-2">
                Habit tracker with deep insights<br />
                to turn effort into real change.
              </p>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Track What Matters, Change What Counts
              </h3>
            </div>
            
            {/* Added image below the content */}
            <div className="w-full mt-4 md:mt-6">
              <img src="/lovable-uploads/72294fef-845b-4724-8b80-eac027068410.png" alt="Holistic Science-Backed Transformation" className="w-full max-w-md mx-auto md:mx-0 rounded-lg shadow-lg object-fill" />
            </div>
          </div>
          
          {/* Timeline indicator 2 - desktop only */}
          <div className="hidden md:flex absolute left-1/2 top-[45%] transform -translate-x-1/2 z-20">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center">
              <img alt="Indian woman profile" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover" src="/lovable-uploads/cd8fcd05-d0d1-4455-9e84-f8ce57d78a94.jpg" />
            </div>
          </div>
          
          {/* Mobile timeline indicator 2 */}
          <div className="flex md:hidden justify-center my-4">
            <div className="w-12 h-12 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center">
              <img src="/lovable-uploads/7d10a697-4563-40b0-801b-377284ce6c97.png" alt="Indian woman profile" className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
          
          {/* Section 3: Science */}
          <div className="md:col-start-1 md:col-end-2 md:row-start-3 flex flex-col items-center md:items-end">
            
          </div>
          
          {/* Section 3: Science image - now moved to right side of divider */}
          <div className="md:col-start-2 md:col-end-3 md:row-start-3 flex justify-center md:justify-start">
            <div className="relative max-w-[80%] sm:max-w-[70%] md:max-w-none">
              
            </div>
          </div>
          
          {/* Timeline indicator 3 - desktop only */}
          <div className="hidden md:flex absolute left-1/2 top-[75%] transform -translate-x-1/2 z-20">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center">
              <img alt="Indian woman profile" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover" src="/lovable-uploads/5e474ac6-d872-427b-8bf1-d428b66bafa3.jpg" />
            </div>
          </div>
          
          {/* Mobile timeline indicator 3 */}
          <div className="flex md:hidden justify-center my-4">
            <div className="w-12 h-12 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center">
              <img src="/lovable-uploads/7d10a697-4563-40b0-801b-377284ce6c97.png" alt="Indian woman profile" className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
        </div>
        
        {/* CTA button */}
        <div className="text-center mt-8 md:mt-12">
          <Button onClick={handleStartJourneyClick} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-full text-base sm:text-lg">
            Start Your Journey
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </section>;
};
