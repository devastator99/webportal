
import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Team } from './components/Team';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { BeyondHealthcare } from './components/BeyondHealthcare';

export const NewLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <Header />
      <main>
        <Hero />
        <BeyondHealthcare />
        <About />
        <Services />
        <Team />
        <Contact />
      </main>
    </div>
  );
};

export default NewLandingPage;
