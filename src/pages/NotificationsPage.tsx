
import React from 'react';
import { NotificationManager } from '@/components/notifications/NotificationManager';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { PatientPageLayout } from '@/components/layout/PatientPageLayout';
import { Bell } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <PatientPageLayout
      title="Notification Settings"
      description="Manage your notification preferences"
    >
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-5 w-5 text-[#7E69AB]" />
        <h2 className="text-xl font-semibold">Notification Preferences</h2>
      </div>
      
      <div className="max-w-md mx-auto">
        <NotificationManager />
      </div>
    </PatientPageLayout>
  );
};

export default NotificationsPage;
