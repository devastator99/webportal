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
  return;
};