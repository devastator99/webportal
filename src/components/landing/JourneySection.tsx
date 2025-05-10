
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { MobileAppMockup } from '../ui/MobileAppMockup';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface JourneySectionProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const JourneySection: React.FC<JourneySectionProps> = ({ openAuthModal }) => {
  const handleStartJourneyClick = () => {
    if (openAuthModal) {
      openAuthModal('register');
    }
  };
  
  // Animation references
  const frameRef = useRef(null);
  const isInView = useInView(frameRef, { once: true, margin: "-100px" });
  const controls = useAnimation();
  
  // Trigger animation when section comes into view
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);
  
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
        
        {/* Framer Motion Animation Showcase */}
        <div className="mt-24 mb-16">
          <h3 className="text-3xl md:text-4xl font-bold mb-10 text-center">Coming Soon to AnubhootiHealth</h3>
          
          {/* Animation Frame Container */}
          <div ref={frameRef} className="relative max-w-4xl mx-auto h-[500px] md:h-[600px]">
            {/* Image 1 */}
            <motion.div
              className="absolute w-full h-full"
              initial={{ opacity: 0 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: 1,
                  transition: { duration: 0.8, delay: 0 }
                }
              }}
            >
              <img 
                src="/lovable-uploads/ee47a2b7-4f50-4fa8-8582-7bd0ded82f95.png"
                alt="AnubhootiHealth Feature"
                className="w-full h-full object-contain rounded-xl"
              />
            </motion.div>
            
            {/* Image 2 */}
            <motion.div
              className="absolute w-full h-full"
              initial={{ opacity: 0 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: [0, 1, 1, 0],
                  transition: { 
                    times: [0, 0.3, 0.7, 1],
                    duration: 4, 
                    delay: 2,
                    ease: "easeInOut"
                  }
                }
              }}
            >
              <img 
                src="/lovable-uploads/42084d5a-5f21-4427-89b7-0842bb3b2bd1.png"
                alt="AnubhootiHealth Feature"
                className="w-full h-full object-contain rounded-xl"
              />
            </motion.div>
            
            {/* Image 3 */}
            <motion.div
              className="absolute w-full h-full"
              initial={{ opacity: 0 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: [0, 1, 1, 0],
                  transition: { 
                    times: [0, 0.3, 0.7, 1],
                    duration: 4, 
                    delay: 6,
                    ease: "easeInOut"
                  }
                }
              }}
            >
              <img 
                src="/lovable-uploads/d397bdf6-e16c-49c4-89ea-d32e89cdcf9e.png"
                alt="AnubhootiHealth Feature"
                className="w-full h-full object-contain rounded-xl"
              />
            </motion.div>
            
            {/* Image 4 - Final image that stays */}
            <motion.div
              className="absolute w-full h-full"
              initial={{ opacity: 0 }}
              animate={controls}
              variants={{
                visible: {
                  opacity: [0, 1],
                  transition: { 
                    duration: 1, 
                    delay: 10,
                    ease: "easeIn"
                  }
                }
              }}
            >
              <img 
                src="/lovable-uploads/987432ff-c332-45b9-8d10-e97cca210f3b.png"
                alt="AnubhootiHealth Company Info"
                className="w-full h-full object-contain rounded-xl"
              />
            </motion.div>
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
