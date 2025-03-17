
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { featureFlags } from "@/config/features";
import { toast } from "sonner";

// Define the interface for our form values
interface FeatureFlagsFormValues {
  enableChat: boolean;
  enableChatbotWidget: boolean;
  patientDashboardChat: boolean;
  doctorDashboardChat: boolean;
  receptionDashboardChat: boolean;
}

export const AdminSettings = () => {
  // Initialize form with current feature flag values
  const form = useForm<FeatureFlagsFormValues>({
    defaultValues: {
      enableChat: featureFlags.enableChat,
      enableChatbotWidget: featureFlags.enableChatbotWidget,
      patientDashboardChat: featureFlags.patientDashboardChat,
      doctorDashboardChat: featureFlags.doctorDashboardChat,
      receptionDashboardChat: featureFlags.receptionDashboardChat,
    },
  });

  const onSubmit = (data: FeatureFlagsFormValues) => {
    // In a real app, this would make an API call to update the flags in the database
    // For this demo, we'll update the values in localStorage
    localStorage.setItem('featureFlags', JSON.stringify(data));
    
    // Update the current featureFlags object (this will be lost on page refresh)
    Object.assign(featureFlags, data);
    
    toast.success("Feature flags updated successfully", {
      description: "Changes will take effect immediately",
    });
  };

  // Load saved feature flags from localStorage when component mounts
  useEffect(() => {
    const savedFlags = localStorage.getItem('featureFlags');
    if (savedFlags) {
      const parsedFlags = JSON.parse(savedFlags);
      form.reset(parsedFlags);
      
      // Update the current featureFlags object
      Object.assign(featureFlags, parsedFlags);
    }
  }, [form]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Feature Settings</CardTitle>
        <Settings className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> 
                  Chat Features
                </h3>
              </div>
              
              <FormField
                control={form.control}
                name="enableChat"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Master Chat Toggle</FormLabel>
                      <FormDescription>
                        Enable or disable all chat functionality across the application
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="ml-6 space-y-4">
                <FormField
                  control={form.control}
                  name="enableChatbotWidget"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Chatbot Widget</FormLabel>
                        <FormDescription>
                          Enable the floating chatbot widget
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!form.watch("enableChat")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="patientDashboardChat"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Patient Dashboard Chat</FormLabel>
                        <FormDescription>
                          Enable chat in the patient dashboard
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!form.watch("enableChat")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="doctorDashboardChat"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Doctor Dashboard Chat</FormLabel>
                        <FormDescription>
                          Enable chat in the doctor dashboard
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!form.watch("enableChat")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="receptionDashboardChat"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Reception Dashboard Chat</FormLabel>
                        <FormDescription>
                          Enable chat in the reception dashboard
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!form.watch("enableChat")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full">Save Settings</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
