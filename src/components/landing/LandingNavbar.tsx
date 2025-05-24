
import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import '@/styles/glass.css';
import { useBreakpoint } from '@/hooks/use-responsive-layout';

interface LandingNavbarProps {
  openAuthModal?: (view?: 'login' | 'register') => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ openAuthModal }) => {
  const navigate = useNavigate();
  const { user, resetInactivityTimer, isSigningOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
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
    navigate('/');
  }, [navigate, resetInactivityTimer]);
  
  const handleStartClick = useCallback(() => {
    resetInactivityTimer();
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

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 ${scrolled ? 'glass-nav scrolled' : 'glass-nav'} top-navbar z-50`}
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-2 sm:py-3">
        <div 
          className="text-lg sm:text-xl md:text-2xl font-bold text-white cursor-pointer truncate" 
          onClick={handleLogoClick}
        >
          AnubhootiHealth
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
    </motion.nav>
  );
};
