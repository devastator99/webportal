
import React from 'react';
import { Button } from '@/components/ui/button';
import '@/styles/glass.css';
import { useBreakpoint } from '@/hooks/use-responsive-layout';

interface CallToActionProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({
  openAuthModal
}) => {
  const {
    isSmallScreen
  } = useBreakpoint();
  
  const handleStartClick = () => {
    if (openAuthModal) {
      openAuthModal('login');
    }
  };
  
  return (
    <section className="py-24 bg-gradient-to-br from-purple-800 to-indigo-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
      <div className="glassmorphism-container absolute inset-0 overflow-hidden">
        <div className="glassmorphism-circle opacity-20 bg-gradient-to-br from-purple-400 to-indigo-400 top-1/4 -left-[10%]"></div>
        <div className="glassmorphism-circle opacity-20 bg-gradient-to-br from-blue-400 to-indigo-400 bottom-1/4 -right-[10%]"></div>
      </div>
    </section>
  );
};
