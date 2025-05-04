
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PatientAppLayout } from '@/layouts/PatientAppLayout';
import { UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientProfile } from '@/components/dashboard/patient/PatientProfile';
import { Card } from '@/components/ui/card';

const PatientProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  return (
    <PatientAppLayout
      title="Your Profile"
      description="View and update your personal information"
      showHeader
    >
      <div className="flex items-center gap-2 mb-6">
        <UserRound className="h-5 w-5 text-[#7E69AB]" />
        <h2 className="text-xl font-semibold">Patient Profile</h2>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card className="p-6">
            <PatientProfile />
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Account Settings</h3>
            <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            <div className="mt-4">
              <Button 
                variant="outline"
                onClick={() => navigate("/notifications")}
              >
                Notification Preferences
              </Button>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
            <p className="text-muted-foreground">
              Configure how and when you receive notifications.
            </p>
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/notifications")}
              >
                Manage Notifications
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </PatientAppLayout>
  );
};

export default PatientProfilePage;
