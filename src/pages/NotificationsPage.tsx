
import React from 'react';
import { NotificationManager } from '@/components/notifications/NotificationManager';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      <div className="max-w-md mx-auto">
        <NotificationManager />
      </div>
    </div>
  );
};

export default NotificationsPage;
