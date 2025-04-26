
import React from 'react';

export const JourneySection = () => {
  return (
    <section className="section-dark">
      <div className="container mx-auto">
        <h2 className="section-heading">Your Journey at AnubhootiHealth</h2>
        
        <div className="timeline">
          <div className="timeline-line"></div>
          
          <div className="timeline-item">
            <div className="timeline-avatar">
              <img 
                src="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9" 
                alt="Avatar" 
                className="w-16 h-16 rounded-full"
              />
            </div>
            <div className="timeline-content">
              <p className="text-xl">
                Doctor, dietitian, psychologist & AI—all in one seamless conversation.
              </p>
              
              <h3 className="text-4xl font-bold my-4">
                Personalized Care, Powered by People & AI
              </h3>
              
              <div className="flex flex-wrap md:flex-nowrap mt-12 gap-4">
                <div className="w-full md:w-1/2 bg-black rounded-xl overflow-hidden p-4">
                  <img 
                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" 
                    alt="Analytics" 
                    className="rounded-lg mb-4"
                  />
                  <div className="flex items-center gap-2 bg-black rounded-full px-4 py-2 w-max">
                    <span className="text-green-500">●</span>
                    <span>Advanced Analytics</span>
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <img 
                    src="https://images.unsplash.com/photo-1501854140801-50d01698950b" 
                    alt="Runner" 
                    className="rounded-xl h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-avatar">
              <img 
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb" 
                alt="Avatar" 
                className="w-16 h-16 rounded-full"
              />
            </div>
            <div className="timeline-content">
              <p className="text-xl">
                Doctor, dietitian, Exercise coache, psychologist & AI— all in one seamless conversation.
              </p>
              
              <h3 className="text-4xl font-bold my-4">
                One Chat, Full Care
              </h3>
              
              <div className="flex flex-wrap md:flex-nowrap gap-4 mt-8">
                <img 
                  src="https://images.unsplash.com/photo-1518495973542-4542c06a5843" 
                  alt="Woman with salad" 
                  className="w-full md:w-1/2 rounded-xl"
                />
                
                <div className="w-full md:w-1/2 flex flex-col justify-center gap-4">
                  <div className="bg-blue-500 rounded-xl p-4">Chat message 1</div>
                  <div className="bg-gray-200 rounded-xl p-4 text-black self-end">Chat reply 1</div>
                  <div className="bg-gray-200 rounded-xl p-4 text-black self-end">
                    Chat reply 2
                    <div className="bg-teal-200 rounded-full w-8 h-8 flex items-center justify-center">
                      →
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-xl mt-8">
                Habit tracker with deep insights to turn effort into real change.
              </p>
              
              <h3 className="text-4xl font-bold my-4">
                Track What Matters, Change What Counts
              </h3>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-avatar">
              <img 
                src="https://images.unsplash.com/photo-1501854140801-50d01698950b" 
                alt="Avatar" 
                className="w-16 h-16 rounded-full"
              />
            </div>
            <div className="timeline-content">
              <div className="flex flex-wrap md:flex-nowrap gap-4">
                <img 
                  src="/lovable-uploads/90f15a11-74d0-46f1-8b5f-38cb0b2595d4.png" 
                  alt="App tracking" 
                  className="w-full md:w-1/2 rounded-xl"
                />
                
                <div className="w-full md:w-1/2 flex items-center">
                  <div>
                    <div className="floating-calendar mb-8"></div>
                    <p className="text-xl mt-8">From band-aids to breakthroughs.</p>
                    <h3 className="text-4xl font-bold my-4">
                      Holistic, Science-Backed Transformation
                    </h3>
                  </div>
                </div>
              </div>
              
              <div className="flex mt-8 gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9" 
                  alt="Microscope" 
                  className="w-full md:w-1/2 rounded-xl"
                />
                <div className="w-full md:w-1/2">
                  <div className="h-full flex items-center justify-center">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="10" y="10" width="20" height="20" fill="#9AE6B4" />
                      <rect x="10" y="40" width="20" height="20" fill="#9AE6B4" />
                      <rect x="40" y="10" width="20" height="20" fill="#9AE6B4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
