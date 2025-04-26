import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarDay {
  number: number;
  name: string;
  isActive?: boolean;
}

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  
  useEffect(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const today = new Date();
    const currentDay = today.getDay();
    
    const calendar = days.map((day, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (currentDay - 1) + index);
      return {
        number: date.getDate(),
        name: day,
        isActive: index === 2 // Making Wednesday active for demo
      };
    });
    
    setCalendarDays(calendar);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Wix Studio Banner */}
      <div className="bg-white text-center py-1 text-sm">
        Built on WIX STUDIO
      </div>
      
      {/* Main Header */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-bold text-white"
            >
              AnubhootiHealth
            </motion.div>
            
            {/* Calendar Strip */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:flex bg-cyan-400 rounded-xl p-2 space-x-4"
            >
              {calendarDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`px-4 py-2 text-center rounded-lg transition-colors ${
                    day.isActive 
                      ? 'bg-white text-cyan-400' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <div className="text-lg font-bold">{day.number}</div>
                  <div className="text-sm">{day.name}</div>
                </div>
              ))}
            </motion.div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto text-center text-white"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Integrative Medicine Solutions
            </h1>
            <p className="text-xl mb-8">Hi, Rakesh!</p>
            <Button 
              className="bg-black hover:bg-black/80 text-white rounded-full px-8 py-6 text-lg"
              onClick={() => window.location.href = '#start'}
            >
              Start Today
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg md:hidden z-50"
            >
              <div className="flex flex-col p-6 space-y-4">
                <a href="#about" className="text-gray-700 hover:text-primary">About</a>
                <a href="#services" className="text-gray-700 hover:text-primary">Services</a>
                <a href="#team" className="text-gray-700 hover:text-primary">Team</a>
                <a href="#contact" className="text-gray-700 hover:text-primary">Contact</a>
                <Button asChild className="w-full mt-4">
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
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
