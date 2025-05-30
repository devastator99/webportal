
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Phone, MessageSquare, TestTube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const TwilioConfigValidator = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  const checkTwilioConfiguration = async () => {
    setIsChecking(true);
    setConfigStatus(null);

    try {
      const { data, error } = await supabase.functions.invoke('configure-twilio-notifications');
      
      if (error) throw error;
      
      setConfigStatus(data);
      
      if (data.configured) {
        toast({
          title: "Configuration Valid",
          description: "All Twilio credentials are properly configured",
        });
      } else {
        toast({
          title: "Configuration Issues Found",
          description: `Missing: ${data.details?.missingSecrets?.join(', ')}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Configuration check error:', error);
      toast({
        title: "Check Failed",
        description: error.message || "Failed to check Twilio configuration",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const testNotifications = async () => {
    if (!configStatus?.configured) {
      toast({
        title: "Configuration Required",
        description: "Please fix configuration issues before testing",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setTestResults(null);

    try {
      // Test with a sample phone number and email
      const testPhone = "+919263865032"; // Using the WhatsApp number as test
      const testEmail = "test@example.com";

      const { data, error } = await supabase.functions.invoke('test-notifications', {
        body: {
          test_type: 'all',
          phone: testPhone,
          email: testEmail
        }
      });

      if (error) throw error;

      setTestResults(data);
      
      if (data.success) {
        toast({
          title: "Test Completed",
          description: "Check the test results below for details",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error || "Notification test failed",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to run notification tests",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Twilio Configuration Validator & Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={checkTwilioConfiguration}
            disabled={isChecking}
            className="flex-1"
          >
            {isChecking ? "Checking Configuration..." : "Validate Twilio Setup"}
          </Button>
          
          <Button 
            onClick={testNotifications}
            disabled={isTesting || !configStatus?.configured}
            variant="outline"
            className="flex-1"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? "Testing..." : "Test Notifications"}
          </Button>
        </div>

        {configStatus && (
          <div className="space-y-3">
            <Alert className={configStatus.configured ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {configStatus.configured ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={configStatus.configured ? "text-green-800" : "text-red-800"}>
                  {configStatus.message}
                </AlertDescription>
              </div>
            </Alert>

            {configStatus.details && (
              <div className="space-y-2">
                <h4 className="font-medium">Configuration Details:</h4>
                
                {configStatus.details.presentSecrets?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-700">✅ Configured:</p>
                    {configStatus.details.presentSecrets.map((secret: string) => (
                      <div key={secret} className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        {secret}
                      </div>
                    ))}
                  </div>
                )}

                {configStatus.details.missingSecrets?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-700">❌ Missing:</p>
                    {configStatus.details.missingSecrets.map((secret: string) => (
                      <div key={secret} className="flex items-center gap-2 text-sm text-red-600">
                        <XCircle className="h-3 w-3" />
                        {secret}
                      </div>
                    ))}
                  </div>
                )}

                {configStatus.instructions && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-medium text-blue-800 mb-2">Setup Instructions:</p>
                    <div className="space-y-1">
                      {configStatus.instructions.setupGuide?.map((step: string, index: number) => (
                        <p key={index} className="text-sm text-blue-700">{step}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {testResults && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results:</h4>
            
            <Alert className={testResults.success ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}>
              <AlertDescription className={testResults.success ? "text-blue-800" : "text-red-800"}>
                {testResults.message}
              </AlertDescription>
            </Alert>

            {testResults.results && (
              <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-medium mb-2">Environment Check:</p>
                  {Object.entries(testResults.results.environment_check).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {value === 'Present' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span className={value === 'Present' ? 'text-green-700' : 'text-red-700'}>
                        {key}: {value as string}
                      </span>
                    </div>
                  ))}
                </div>

                {testResults.results.notification_result && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium mb-2">Notification Results:</p>
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {JSON.stringify(testResults.results.notification_result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 border rounded">
          <p className="text-sm font-medium mb-2">Expected Configuration:</p>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              TWILIO_PHONE_NUMBER: +16508648816
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3 w-3" />
              TWILIO_WHATSAPP_NUMBER: whatsapp:+919263865032
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
