
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, User, Settings, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  
  // If user is not logged in, don't show the navigation
  if (!user && location.pathname !== '/dashboard' && location.pathname !== '/dashboard-alt') {
    return null;
  }
  
  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      label: 'Calendar',
      icon: Calendar,
      path: '/dashboard',
      active: location.pathname.includes('appointments')
    },
    {
      label: 'Patients',
      icon: User,
      path: '/patients',
      active: location.pathname === '/patients'
    },
    {
      label: 'Chat',
      icon: MessageCircle,
      path: '/chat',
      active: location.pathname === '/chat'
    },
    {
      label: 'Profile',
      icon: Settings,
      path: '/dashboard-alt',
      active: location.pathname === '/dashboard-alt'
    }
  ];

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <button
          key={item.label}
          className={`mobile-nav-item ${item.active ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <item.icon className="mobile-nav-icon h-5 w-5" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
