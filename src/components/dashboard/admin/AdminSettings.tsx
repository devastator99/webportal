
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { featureFlags, updateFeatureFlags } from "@/config/features";
import { Checkbox } from "@/components/ui/checkbox";

export const AdminSettings = () => {
  const [flags, setFlags] = useState(featureFlags);
  const { toast } = useToast();

  useEffect(() => {
    setFlags(featureFlags);
  }, []);

  const updateFlag = (key: keyof typeof featureFlags, value: boolean) => {
    updateFeatureFlags({ [key]: value });
    setFlags(prev => ({ ...prev, [key]: value }));
    
    toast({
      title: "Feature flags updated",
      description: `Successfully updated ${key} to ${value}`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Chat Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Enable Chat</h3>
              <p className="text-sm text-muted-foreground">
                Turn on/off all chat functionality across the application
              </p>
            </div>
            <Switch 
              checked={flags.enableChat}
              onCheckedChange={(checked) => updateFlag('enableChat', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Enable Chatbot Widget</h3>
              <p className="text-sm text-muted-foreground">
                Show/hide the floating chatbot widget
              </p>
            </div>
            <Switch 
              checked={flags.enableChatbotWidget}
              onCheckedChange={(checked) => updateFlag('enableChatbotWidget', checked)}
              disabled={!flags.enableChat}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Enable Indian Language Support</h3>
              <p className="text-sm text-muted-foreground">
                Enable support for multiple Indian languages in the chat interface
              </p>
            </div>
            <Switch 
              checked={flags.enableIndianLanguageSupport}
              onCheckedChange={(checked) => updateFlag('enableIndianLanguageSupport', checked)}
              disabled={!flags.enableChat}
            />
          </div>

          <Separator />

          <h3 className="font-medium">Dashboard Chat Controls</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="patient-chat">Patient Dashboard</Label>
              <Switch 
                id="patient-chat"
                checked={flags.patientDashboardChat}
                onCheckedChange={(checked) => updateFlag('patientDashboardChat', checked)}
                disabled={!flags.enableChat}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="doctor-chat">Doctor Dashboard</Label>
              <Switch 
                id="doctor-chat"
                checked={flags.doctorDashboardChat}
                onCheckedChange={(checked) => updateFlag('doctorDashboardChat', checked)}
                disabled={!flags.enableChat}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reception-chat">Reception Dashboard</Label>
              <Switch 
                id="reception-chat"
                checked={flags.receptionDashboardChat}
                onCheckedChange={(checked) => updateFlag('receptionDashboardChat', checked)}
                disabled={!flags.enableChat}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Doctor Dashboard Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="doctor-video-uploader"
              checked={flags.enableDoctorVideoUploader}
              onCheckedChange={(checked) => {
                if (typeof checked === 'boolean') {
                  updateFlag('enableDoctorVideoUploader', checked);
                }
              }}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="doctor-video-uploader" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Enable Video Uploader for Doctors
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow doctors to upload knowledge sharing videos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
