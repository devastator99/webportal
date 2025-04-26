
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export const Services: React.FC = () => {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-purple-100 text-purple-700 font-medium text-sm mb-3">Our Services</span>
          <h2 className="text-4xl md:text-5xl font-bold text-purple-900">Comprehensive Care Solutions</h2>
        </motion.div>
        
        <div className="space-y-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -top-5 -left-5 w-24 h-24 bg-purple-100 rounded-lg z-0"></div>
                <img
                  src="/lovable-uploads/90f15a11-74d0-46f1-8b5f-38cb0b2595d4.png"
                  alt="Diabetes Care"
                  className="rounded-lg shadow-xl w-full h-auto object-cover relative z-10"
                />
                <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-cyan-100 rounded-lg z-0"></div>
              </div>
            </div>
            
            <div className="md:w-1/2 mt-12 md:mt-0">
              <h3 className="text-3xl font-semibold mb-4 text-purple-900">Diabetes Reversal & Management</h3>
              <p className="text-lg text-gray-700 mb-6">
                Our comprehensive diabetes reversal program is designed to help patients 
                regain control of their health. Through personalized nutrition plans, 
                lifestyle modifications, and expert medical guidance, we've helped many 
                patients significantly reduce or eliminate their dependence on medication.
              </p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center">
                  <div className="bg-green-100 p-1 rounded-full mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-gray-700">Personalized blood sugar management plans</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-green-100 p-1 rounded-full mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-gray-700">Lifestyle coaching and continuous monitoring</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-green-100 p-1 rounded-full mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-gray-700">Research-backed treatment protocols</span>
                </li>
              </ul>
              <Button className="bg-purple-700 hover:bg-purple-800 text-white">
                Learn More
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row-reverse items-center gap-12"
          >
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -top-5 -right-5 w-24 h-24 bg-cyan-100 rounded-lg z-0"></div>
                <img
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
                  alt="Nutrition Counseling"
                  className="rounded-lg shadow-xl w-full h-auto object-cover relative z-10"
                />
                <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-purple-100 rounded-lg z-0"></div>
              </div>
            </div>
            
            <div className="md:w-1/2 mt-12 md:mt-0">
              <h3 className="text-3xl font-semibold mb-4 text-purple-900">Personalized Nutrition Plans</h3>
              <p className="text-lg text-gray-700 mb-6">
                Our expert nutritionists create customized meal plans tailored to your 
                specific health goals, dietary preferences, and medical conditions. 
                We focus on sustainable eating habits that support long-term health 
                and well-being rather than short-term fixes.
              </p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center">
                  <div className="bg-green-100 p-1 rounded-full mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-gray-700">Custom meal planning based on your lifestyle</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-green-100 p-1 rounded-full mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-gray-700">Nutritional therapy for specific conditions</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-green-100 p-1 rounded-full mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-gray-700">Ongoing dietary optimization and guidance</span>
                </li>
              </ul>
              <Button className="bg-purple-700 hover:bg-purple-800 text-white">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
