
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
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
    const days = ['Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const calendar = days.map((day, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (dayOfWeek - 3) + index); // Start from Wednesday
      return {
        number: date.getDate(),
        name: day,
        isActive: index === 1 // Making Thursday active
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
      <div className="bg-white text-center py-1.5 text-sm">
        Built on <strong>WIX</strong>STUDIO
      </div>
      
      {/* Main Header */}
      <div className="bg-gradient-header">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2">
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 text-white"
            >
              <Menu className="h-6 w-6" />
            </motion.button>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-medium text-white flex items-center"
            >
              AnubhootiHealth
            </motion.div>
            
            <Button 
              onClick={handleStart}
              className="bg-black hover:bg-black/80 text-white rounded-full px-6 py-2"
            >
              Start Today
            </Button>
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

        {/* Calendar Strip */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="fixed bottom-32 left-4 bg-[#00C2FF] rounded-xl p-2 space-x-2 flex"
        >
          {calendarDays.map((day, index) => (
            <motion.div 
              key={index}
              className={`px-3 py-1.5 text-center rounded-lg transition-colors cursor-pointer ${
                day.isActive 
                  ? 'bg-white text-[#00C2FF]' 
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
      </div>
    </header>
  );
};
