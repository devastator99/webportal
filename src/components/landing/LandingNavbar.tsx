
import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import '@/styles/glass.css';
import { useBreakpoint } from '@/hooks/use-responsive-layout';
import { Menu, X } from 'lucide-react';

interface LandingNavbarProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ openAuthModal }) => {
  const navigate = useNavigate();
  const { user, resetInactivityTimer, isSigningOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSmallScreen } = useBreakpoint();
  
  // Check scroll position and update navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogoClick = useCallback(() => {
    resetInactivityTimer();
    setMobileMenuOpen(false);
    navigate('/');
  }, [navigate, resetInactivityTimer]);
  
  const handleStartClick = useCallback(() => {
    resetInactivityTimer();
    setMobileMenuOpen(false);
    // If signing out, don't navigate to prevent conflicts
    if (isSigningOut) return;
    
    if (user) {
      navigate('/dashboard');
    } else if (openAuthModal) {
      openAuthModal('login');
    } else {
      navigate('/auth');
    }
  }, [user, isSigningOut, navigate, resetInactivityTimer, openAuthModal]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 ${scrolled ? 'glass-nav scrolled' : 'glass-nav'} top-navbar z-50`}
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-2 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu button */}
          <button 
            onClick={toggleMobileMenu} 
            className="md:hidden text-white p-1 rounded-md focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div 
            className="text-lg sm:text-xl md:text-2xl font-bold text-white cursor-pointer truncate" 
            onClick={handleLogoClick}
          >
            AnubhootiHealth
          </div>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={handleStartClick}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-base font-medium hover:shadow-lg transition-all duration-300"
            disabled={isSigningOut}
          >
            {user ? "Dashboard" : "Start Today"}
          </button>
        </div>

        {/* Mobile navigation button */}
        <div className="md:hidden">
          <button
            onClick={handleStartClick}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium hover:shadow-lg transition-all duration-300"
            disabled={isSigningOut}
          >
            {user ? "Dashboard" : "Start"}
          </button>
        </div>
      </div>
      
      {/* Mobile menu with improved animation */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden glass-nav pb-4 px-4"
        >
          <div className="flex flex-col space-y-3 pt-2">
            <a href="#benefits" className="text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors" 
              onClick={() => setMobileMenuOpen(false)}>
              Benefits
            </a>
            <a href="#offerings" className="text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}>
              Offerings
            </a>
            <button
              onClick={handleStartClick}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full w-full py-2 font-medium hover:shadow-lg transition-all duration-300 mt-2"
              disabled={isSigningOut}
            >
              {user ? "Dashboard" : "Start Today"}
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};
