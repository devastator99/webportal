
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegistrationTaskProcessor } from '@/components/testing/RegistrationTaskProcessor';
import { RegistrationDiagnostic } from '@/components/testing/RegistrationDiagnostic';
import { NotificationChecker } from '@/components/testing/NotificationChecker';
import { DeleteSpecificUser } from '@/components/testing/DeleteSpecificUser';
import { TestDataCleanup } from '@/components/testing/TestDataCleanup';
import { TestDataManager } from '@/components/testing/TestDataManager';
import { PhoneRegistrationDebugger } from '@/components/testing/PhoneRegistrationDebugger';
import { UserPhoneChecker } from '@/components/testing/UserPhoneChecker';
import { TestFlowValidator } from '@/components/testing/TestFlowValidator';
import { TwilioConfigValidator } from '@/components/testing/TwilioConfigValidator';
import { Bug, Wrench, Search, Bell, Trash2, Database, Phone, TestTube, Users, Settings } from 'lucide-react';

const TestingPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bug className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Testing & Diagnostics</h1>
      </div>

      <Tabs defaultValue="diagnostic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="diagnostic" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Registration</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="processor" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="delete-user" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete User</span>
          </TabsTrigger>
          <TabsTrigger value="cleanup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Cleanup</span>
          </TabsTrigger>
          <TabsTrigger value="test-data" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Test Data</span>
          </TabsTrigger>
          <TabsTrigger value="phone-debug" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Phone Debug</span>
          </TabsTrigger>
          <TabsTrigger value="phone-checker" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Phone Check</span>
          </TabsTrigger>
          <TabsTrigger value="flow-validator" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            <span className="hidden sm:inline">Flow Tests</span>
          </TabsTrigger>
          <TabsTrigger value="twilio-config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Twilio</span>
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

        <TabsContent value="delete-user">
          <DeleteSpecificUser />
        </TabsContent>

        <TabsContent value="cleanup">
          <TestDataCleanup />
        </TabsContent>

        <TabsContent value="test-data">
          <TestDataManager />
        </TabsContent>

        <TabsContent value="phone-debug">
          <PhoneRegistrationDebugger />
        </TabsContent>

        <TabsContent value="phone-checker">
          <UserPhoneChecker />
        </TabsContent>

        <TabsContent value="flow-validator">
          <TestFlowValidator />
        </TabsContent>

        <TabsContent value="twilio-config">
          <TwilioConfigValidator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestingPage;
