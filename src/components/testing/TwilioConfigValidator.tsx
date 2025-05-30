
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Phone, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const TwilioConfigValidator = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Twilio Configuration Validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={checkTwilioConfiguration}
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? "Checking Configuration..." : "Validate Twilio Setup"}
        </Button>

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
