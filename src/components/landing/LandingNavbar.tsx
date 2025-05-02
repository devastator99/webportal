import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthButton } from '@/components/auth/AuthButton';
import { motion } from 'framer-motion';
import '@/styles/glass.css';

interface LandingNavbarProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ openAuthModal }) => {
  const navigate = useNavigate();
  const { user, resetInactivityTimer, isSigningOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
      openAuthModal('register');
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
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Mobile menu button, only shown on mobile */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden text-white"
          >
            ≡
          </button>
          
          <div 
            className="text-xl sm:text-2xl font-bold text-white cursor-pointer" 
            onClick={handleLogoClick}
          >
            AnubhootiHealth
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartClick}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full px-6 py-2 font-medium hover:shadow-lg transition-all duration-300 hidden md:block"
            disabled={isSigningOut}
          >
            Start Today
          </button>
          <AuthButton openAuthModal={openAuthModal} />
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden glass-nav pb-4 px-4"
        >
          <button
            onClick={handleStartClick}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full w-full py-2 font-medium hover:shadow-lg transition-all duration-300 mt-2"
            disabled={isSigningOut}
          >
            Start Today
          </button>
        </motion.div>
      )}
    </motion.nav>
  );
};
