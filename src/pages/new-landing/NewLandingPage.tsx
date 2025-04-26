
import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Team } from './components/Team';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { BeyondHealthcare } from './components/BeyondHealthcare';
import { motion } from 'framer-motion';
import '../../styles/landingPage.css';

export const NewLandingPage: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white text-gray-800 font-sans overflow-hidden"
    >
      <Header />
      <main className="pt-16">
        <Hero />
        <BeyondHealthcare />
        <About />
        <Services />
        <Team />
        <Contact />
        
        <footer className="bg-gray-900 text-white py-8 text-center">
          <div className="container mx-auto px-6">
            <div className="mb-4">
              <span className="text-2xl font-bold">AnubhootiHealth</span>
            </div>
            <p className="mb-6 text-gray-300">Transforming healthcare through integrative medicine</p>
            <div className="flex justify-center space-x-6 mb-6">
              <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-white">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
            </div>
            <div className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} AnubhootiHealth. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </motion.div>
  );
};

export default NewLandingPage;
