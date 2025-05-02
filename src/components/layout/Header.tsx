
import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import '../styles/glass.css';

interface HeaderProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ openAuthModal }) => {
  return (
    <header className="w-full fixed top-0 z-50">
      <LandingNavbar openAuthModal={openAuthModal} />
    </header>
  );
};
