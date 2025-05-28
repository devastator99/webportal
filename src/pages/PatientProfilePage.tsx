
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientAppLayout } from '@/layouts/PatientAppLayout';
import { UserRound, Settings, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientProfile } from '@/components/dashboard/patient/PatientProfile';
import { Card } from '@/components/ui/card';

const PatientProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <PatientAppLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </PatientAppLayout>
    );
  }

  return (
    <PatientAppLayout
      title="Your Profile"
      description="View and update your personal information"
      showHeader
      fullWidth={true}
    >
      <div className="w-full max-w-[1200px] mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <UserRound className="h-5 w-5 text-[#7E69AB]" />
          <h2 className="text-xl font-semibold">Patient Profile</h2>
        </div>

        <Tabs defaultValue="profile" className="w-full space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="w-full">
            <Card className="p-6 w-full">
              <PatientProfile />
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="w-full">
            <Card className="p-6 w-full">
              <h3 className="text-lg font-medium mb-4">Account Settings</h3>
              <p className="text-muted-foreground mb-4">
                Manage your account settings and preferences.
              </p>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Password</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Change your account password
                  </p>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Privacy</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Manage your privacy settings
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="w-full">
            <Card className="p-6 w-full">
              <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
              <p className="text-muted-foreground mb-4">
                Configure how and when you receive notifications.
              </p>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Receive updates via email
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    Manage Email Settings
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Receive push notifications in your browser
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    Configure Push Notifications
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PatientAppLayout>
  );
};

export default PatientProfilePage;
