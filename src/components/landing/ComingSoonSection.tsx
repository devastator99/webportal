
import React from 'react';

export const ComingSoonSection = () => {
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-r from-purple-900 via-pink-700 to-purple-900">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="w-full md:w-1/2 text-white animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              COMING SOON
            </h2>
            <p className="text-xl mb-8">
              Keep up With Our Science Packed Insights
            </p>
          </div>
          
          <div className="w-full md:w-1/2 animate-float">
            <div className="relative">
              <img
                src="/lovable-uploads/1e457888-1ca5-4a77-a065-fe7b4765fe5a.png"
                alt="Mobile App Preview"
                className="w-full max-w-lg mx-auto transform rotate-12 hover:rotate-0 transition-transform duration-500"
              />
              <img
                src="/lovable-uploads/e42732ca-e658-4992-8a2d-863555e56873.png"
                alt="Second Mobile App Preview"
                className="absolute top-0 left-0 w-full max-w-lg mx-auto transform -rotate-12 hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-slow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                background: 'white',
                borderRadius: '50%',
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
