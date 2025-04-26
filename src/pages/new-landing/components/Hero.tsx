
import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-white">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
          Take Control of Your Health Today
        </h1>
        <p className="text-xl text-gray-700 mb-8 animate-fade-in">
          Holistic integrated medicine solutions for your well-being
        </p>
        <div className="animate-fade-in">
          <a
            href="https://wa.me/917997016598"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-md text-lg font-semibold"
          >
            Get Started
          </a>
        </div>
      </div>
    </section>
  );
};
