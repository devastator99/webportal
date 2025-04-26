
import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <section className="pt-48 pb-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-purple-100/50 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-cyan-100/30 blur-3xl" />
        
        <div className="flex flex-col lg:flex-row items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 text-center lg:text-left mb-12 lg:mb-0"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Take Control of Your Health Today
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-lg">
              Holistic integrated medicine solutions for your well-being. Experience personalized care that addresses the root causes, not just symptoms.
            </p>
            <Button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white px-8 py-3 rounded-full text-lg"
            >
              Get Started
            </Button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:w-1/2"
          >
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-purple-200 z-0" />
              <div className="relative z-10 bg-white rounded-2xl shadow-xl overflow-hidden">
                <img 
                  src="/lovable-uploads/1e457888-1ca5-4a77-a065-fe7b4765fe5a.png"
                  alt="Health Monitoring App" 
                  className="w-full object-cover"
                />
                <div className="p-6 bg-gradient-to-r from-purple-50 to-cyan-50">
                  <h3 className="text-xl font-bold text-purple-900 mb-2">AI-Powered Health Monitoring</h3>
                  <p className="text-gray-600">Track your progress with our advanced tools and personalized recommendations</p>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-cyan-100 z-0" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
