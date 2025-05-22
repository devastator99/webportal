
import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import '@/styles/glass.css';
import { useResponsive } from '@/contexts/ResponsiveContext';

interface HeaderProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ openAuthModal }) => {
  const { isMobile } = useResponsive();

  return (
    <header 
      className={`w-full fixed top-0 z-50 ${isMobile ? 'py-1' : 'py-0'}`}
    >
      <LandingNavbar openAuthModal={openAuthModal} />
    </header>
  );
};
