
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, Activity, FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WhatsAppStyleChatInterface } from '@/components/chat/WhatsAppStyleChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) {
    return null;
  }

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      
      toast({
        title: "Signing out...",
        description: "Please wait while we sign you out",
      });
      
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
      setIsSigningOut(false);
    }
  };
  
  const patientNavItems = [
    {
      label: 'Prescription',
      icon: FileText,
      action: () => navigate('/prescriptions'),
      active: location.pathname === '/prescriptions'
    },
    {
      label: 'Habits',
      icon: Activity,
      action: () => navigate('/habits'),
      active: location.pathname === '/habits'
    },
    {
      label: 'Profile',
      icon: Settings,
      action: () => navigate('/dashboard-alt'),
      active: location.pathname === '/dashboard-alt'
    },
    {
      label: isSigningOut ? 'Signing Out...' : 'Sign Out',
      icon: LogOut,
      action: handleSignOut,
      active: false
    }
  ];
  
  const otherRoleNavItems = [
    {
      label: 'Profile',
      icon: Settings,
      action: () => navigate('/dashboard-alt'),
      active: location.pathname === '/dashboard-alt'
    },
    {
      label: isSigningOut ? 'Signing Out...' : 'Sign Out',
      icon: LogOut,
      action: handleSignOut,
      active: false
    }
  ];
  
  let navItems = userRole === 'patient' ? patientNavItems : otherRoleNavItems;

  return (
    <>
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`mobile-nav-item ${item.active ? 'active' : ''}`}
            onClick={item.action}
            aria-label={item.label}
            disabled={item.label === 'Signing Out...'}
          >
            <item.icon 
              className="mobile-nav-icon h-5 w-5" 
            />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};
