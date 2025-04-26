
import React from 'react';

export const About: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold">About us</p>
          <h2 className="text-3xl font-bold mt-2">Revolutionizing Healthcare</h2>
          <div className="mt-8 max-w-3xl mx-auto">
            <p className="mt-4 text-gray-700">
              Welcome to Anubhooti Health—where we redefine the boundaries of wellness. 
              Our mission goes beyond conventional health solutions, delving deep into 
              the science of metabolic health, epigenetics, and metagenomics. We don't 
              just treat symptoms; we address the very core of your well-being.
            </p>
            <p className="mt-4 text-gray-700">
              Through a powerful synergy of personalized nutrition, optimized sleep, 
              strategic exercise, and effective stress management, we aim to unlock your 
              body's true potential and transform your health at its most fundamental level. 
              Experience a revolutionary approach to wellness—rooted in cutting-edge research 
              and designed to create lasting change.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
