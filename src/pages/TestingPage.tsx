import React from 'react';
import { RegistrationTaskProcessor } from '@/components/testing/RegistrationTaskProcessor';
import { PhoneRegistrationDebugger } from '@/components/testing/PhoneRegistrationDebugger';
import { TestDataCleanup } from '@/components/testing/TestDataCleanup';
import { RegistrationDataVerifier } from '@/components/testing/RegistrationDataVerifier';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Database, Shield, Phone } from 'lucide-react';

const TestingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Testing Tools</h1>
          <p className="text-lg text-gray-600">Admin tools for debugging and managing registration issues</p>
        </div>
        
        {/* Registration Task Processor - Most Important Tool */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="bg-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Wrench className="h-6 w-6" />
              Registration Task Processor
              <span className="text-sm bg-blue-200 px-2 py-1 rounded-full font-normal">Primary Tool</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <RegistrationTaskProcessor />
          </CardContent>
        </Card>
        
        {/* Other Testing Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Test Data Cleanup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TestDataCleanup />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Registration Data Verifier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RegistrationDataVerifier />
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Registration Debugger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhoneRegistrationDebugger />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestingPage;
