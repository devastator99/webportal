
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">AnubhootiHealth</div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Desktop menu */}
          <div className="hidden md:flex space-x-6">
            <a href="#about" className="text-gray-700 hover:text-primary">About</a>
            <a href="#services" className="text-gray-700 hover:text-primary">Services</a>
            <a href="#team" className="text-gray-700 hover:text-primary">Team</a>
            <a href="#contact" className="text-gray-700 hover:text-primary">Contact</a>
          </div>
          
          <div className="hidden md:block">
            <Button asChild>
              <a 
                href="https://wa.me/917997016598" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Get Started
              </a>
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} mt-4`}>
          <div className="flex flex-col space-y-4">
            <a href="#about" className="text-gray-700 hover:text-primary">About</a>
            <a href="#services" className="text-gray-700 hover:text-primary">Services</a>
            <a href="#team" className="text-gray-700 hover:text-primary">Team</a>
            <a href="#contact" className="text-gray-700 hover:text-primary">Contact</a>
            <Button asChild className="w-full">
              <a 
                href="https://wa.me/917997016598" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Get Started
              </a>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
};
