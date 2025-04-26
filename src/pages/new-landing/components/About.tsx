
import React from 'react';
import { motion } from 'framer-motion';

export const About: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-gradient-to-b from-white to-purple-50">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-purple-100 text-purple-700 font-medium text-sm mb-3">About us</span>
          <h2 className="text-4xl md:text-5xl font-bold text-purple-900 mt-2">Revolutionizing Healthcare</h2>
          <div className="mt-8 max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 mb-6">
              Welcome to Anubhooti Health—where we redefine the boundaries of wellness. 
              Our mission goes beyond conventional health solutions, delving deep into 
              the science of metabolic health, epigenetics, and metagenomics. We don't 
              just treat symptoms; we address the very core of your well-being.
            </p>
            <p className="text-lg text-gray-700">
              Through a powerful synergy of personalized nutrition, optimized sleep, 
              strategic exercise, and effective stress management, we aim to unlock your 
              body's true potential and transform your health at its most fundamental level. 
              Experience a revolutionary approach to wellness—rooted in cutting-edge research 
              and designed to create lasting change.
            </p>
          </div>
        </motion.div>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center p-6 bg-white rounded-lg shadow-md"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-purple-700">95%</h3>
            <p className="text-gray-600 mt-2">Patient Satisfaction</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center p-6 bg-white rounded-lg shadow-md"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-purple-700">15+</h3>
            <p className="text-gray-600 mt-2">Years Experience</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center p-6 bg-white rounded-lg shadow-md"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-purple-700">2000+</h3>
            <p className="text-gray-600 mt-2">Patients Treated</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center p-6 bg-white rounded-lg shadow-md"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-purple-700">24/7</h3>
            <p className="text-gray-600 mt-2">Support Available</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
