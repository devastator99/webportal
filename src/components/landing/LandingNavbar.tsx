newlanding
import React, { useState } from 'react';
=======

import React, { useCallback, useState, useEffect } from 'react';
main
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthButton } from '@/components/auth/AuthButton';

export const LandingNavbar = () => {
  const navigate = useNavigate();
  const { user, resetInactivityTimer, isSigningOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  
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
    } else {
      navigate('/auth');
    }
  }, [user, isSigningOut, navigate, resetInactivityTimer]);

  return (
 newlanding
    <nav className="fixed top-8 left-0 right-0 z-50 px-4">
      <div className="bg-white/20 backdrop-blur-md rounded-full shadow-lg max-w-6xl mx-auto flex justify-between items-center px-4 py-2 gap-x-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
            ≡
          </button>
          <div 
            className="text-xl sm:text-2xl font-bold text-white cursor-pointer" 
            onClick={handleLogoClick}
          >
            AnubhootiHealth
          </div>
=======
    <nav className={`fixed top-0 left-0 right-0 ${scrolled ? 'glass-nav scrolled' : 'glass-nav'} top-navbar`}>
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">
        <div 
          className="text-xl sm:text-2xl font-bold text-white cursor-pointer" 
          onClick={handleLogoClick}
        >
          AnubhootiHealth
 main
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartClick}
            className="bg-black text-white rounded-full px-6 py-2 font-medium hover:bg-opacity-80 hidden md:block"
            disabled={isSigningOut}
          >
            Start Today
          </button>
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};
