
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TestTube, Mail, MessageSquare, Phone, CheckCircle, XCircle } from 'lucide-react';
import { useTestValidation } from './TestFlowValidator/useTestValidation';
import { TestSuiteCard } from './TestFlowValidator/TestSuiteCard';
import { defaultTestSuites } from './TestFlowValidator/testSuiteData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const TestFlowValidator = () => {
  const {
    suites,
    isRunning,
    overallProgress,
    runTestSuite,
    runAllTests,
    resetTests
  } = useTestValidation(defaultTestSuites);

  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [notificationTesting, setNotificationTesting] = useState(false);
  const [notificationResults, setNotificationResults] = useState<any>(null);
  const { toast } = useToast();

  const testNotification = async (type: 'email' | 'sms' | 'whatsapp' | 'all') => {
    if (!testEmail && (type === 'email' || type === 'all')) {
      toast({
        title: "Email Required",
        description: "Please enter an email address for testing",
        variant: "destructive"
      });
      return;
    }

    if (!testPhone && (type === 'sms' || type === 'whatsapp' || type === 'all')) {
      toast({
        title: "Phone Required", 
        description: "Please enter a phone number for testing",
        variant: "destructive"
      });
      return;
    }

    setNotificationTesting(true);
    setNotificationResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-notifications', {
        body: {
          test_type: type,
          email: testEmail,
          phone: testPhone
        }
      });

      if (error) throw error;

      setNotificationResults(data);
      
      toast({
        title: "Test Completed",
        description: `${type} notification test completed successfully`,
      });
    } catch (error: any) {
      console.error('Notification test error:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test notifications",
        variant: "destructive"
      });
    } finally {
      setNotificationTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Flow Validator
          </CardTitle>
          <CardDescription>
            Automated testing and validation of core application flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Run All Tests
            </Button>
            <Button 
              variant="outline" 
              onClick={resetTests}
              disabled={isRunning}
            >
              Reset Tests
            </Button>
          </div>

          {isRunning && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
          )}

          <div className="grid gap-6">
            {suites.map((suite, suiteIndex) => (
              <TestSuiteCard
                key={suite.name}
                suite={suite}
                suiteIndex={suiteIndex}
                isRunning={isRunning}
                onRunSuite={runTestSuite}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Testing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notification System Testing
          </CardTitle>
          <CardDescription>
            Test email, SMS, and WhatsApp notifications individually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="test-phone">Test Phone Number</Label>
              <Input
                id="test-phone"
                type="tel"
                placeholder="+91 9876543210"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => testNotification('email')}
              disabled={notificationTesting || !testEmail}
              variant="outline"
              size="sm"
            >
              <Mail className="h-4 w-4 mr-2" />
              Test Email
            </Button>
            <Button 
              onClick={() => testNotification('sms')}
              disabled={notificationTesting || !testPhone}
              variant="outline"
              size="sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              Test SMS
            </Button>
            <Button 
              onClick={() => testNotification('whatsapp')}
              disabled={notificationTesting || !testPhone}
              variant="outline"
              size="sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Test WhatsApp
            </Button>
            <Button 
              onClick={() => testNotification('all')}
              disabled={notificationTesting || !testEmail || !testPhone}
              size="sm"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test All
            </Button>
          </div>

          {notificationResults && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Test Results:</h4>
              <div className="space-y-2 text-sm">
                {notificationResults.results?.environment_check && (
                  <div>
                    <strong>Environment Check:</strong>
                    <ul className="list-disc ml-4">
                      {Object.entries(notificationResults.results.environment_check).map(([key, value]) => (
                        <li key={key} className="flex items-center gap-2">
                          {value === 'Present' ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          {key}: {value as string}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <strong>Notification Result:</strong>
                  <pre className="bg-white p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(notificationResults.results?.notification_result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <TestTube className="h-4 w-4" />
        <AlertDescription>
          This validator tests the core functionality of your application including email delivery, 
          SMS/WhatsApp notifications, payment processing, user registration, and database operations. 
          Use this to ensure all critical flows are working correctly before deploying to production.
        </AlertDescription>
      </Alert>
    </div>
  );
};
