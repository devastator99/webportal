
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface CalendarDay {
  number: number;
  name: string;
  isActive?: boolean;
}

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  
  useEffect(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const calendar = days.map((day, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (dayOfWeek - 1) + index);
      return {
        number: date.getDate(),
        name: day,
        isActive: index === 1 // Making Tuesday active to match the image
      };
    });
    
    setCalendarDays(calendar);
  }, []);

  const handleStart = () => {
    navigate('/auth');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Wix Studio Banner */}
      <div className="bg-white text-center py-1 text-sm border-b">
        Built on <strong>WIX</strong>STUDIO
      </div>
      
      {/* Main Header */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-bold text-white flex items-center gap-2"
            >
              <Menu className="h-6 w-6 text-white" />
              AnubhootiHealth
            </motion.div>
            
            <div className="flex items-center gap-4">
              {/* Calendar Strip */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="hidden md:flex bg-cyan-400 rounded-xl p-2 space-x-2"
              >
                {calendarDays.map((day, index) => (
                  <motion.div 
                    key={index} 
                    className={`px-3 py-1.5 text-center rounded-lg transition-colors cursor-pointer ${
                      day.isActive 
                        ? 'bg-white text-cyan-400' 
                        : 'text-white hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-sm font-bold">{day.number}</div>
                    <div className="text-xs">{day.name}</div>
                  </motion.div>
                ))}
              </motion.div>

              <Button 
                onClick={handleStart}
                className="bg-black hover:bg-black/80 text-white rounded-full px-6 py-2"
              >
                Start Today
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-4 pt-16 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto text-center text-white"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Your Health Journey<br />Starts Here
            </h1>
            <p className="text-xl mb-8">Integrative medicine solutions</p>
            <Button 
              className="bg-black hover:bg-black/80 text-white rounded-full px-8 py-6 text-lg"
              onClick={handleStart}
            >
              Start Today
            </Button>
          </motion.div>
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
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 bg-black shadow-lg md:hidden z-50 p-6"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-8">
                  <span className="font-bold text-white">Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
                <nav className="flex flex-col gap-4 text-white">
                  <a href="#about" className="hover:text-purple-300">About</a>
                  <a href="#services" className="hover:text-purple-300">Services</a>
                  <a href="#contact" className="hover:text-purple-300">Contact</a>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
