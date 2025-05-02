
import React from 'react';
import { NotificationManager } from '@/components/notifications/NotificationManager';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { MobileNavigation } from '@/components/mobile/MobileNavigation';
import { useIsMobileOrIPad } from '@/hooks/use-mobile';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const isMobileOrTablet = useIsMobileOrIPad();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="container mx-auto py-8 pb-20">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      <div className="max-w-md mx-auto">
        <NotificationManager />
      </div>
      {isMobileOrTablet && <MobileNavigation />}
    </div>
  );
};

export default NotificationsPage;
