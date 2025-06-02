
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegistrationTaskProcessor } from '@/components/testing/RegistrationTaskProcessor';
import { RegistrationDiagnostic } from '@/components/testing/RegistrationDiagnostic';
import { NotificationChecker } from '@/components/testing/NotificationChecker';
import { Bug, Wrench, Search, Bell } from 'lucide-react';

const TestingPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bug className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Testing & Diagnostics</h1>
      </div>

      <Tabs defaultValue="diagnostic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diagnostic" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Registration Diagnostic
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Checker
          </TabsTrigger>
          <TabsTrigger value="processor" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Task Processor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostic">
          <RegistrationDiagnostic />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationChecker />
        </TabsContent>

        <TabsContent value="processor">
          <RegistrationTaskProcessor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestingPage;
