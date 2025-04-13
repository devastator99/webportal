
import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BellRing, BellOff, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { TimePickerInput } from '@/components/notifications/TimePickerInput';

export const NotificationManager: React.FC = () => {
  const {
    isLoading,
    permissionState,
    isSubscribed,
    preferences,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    updatePreferences,
  } = useNotifications();

  const [quietHoursStart, setQuietHoursStart] = useState(preferences.quiet_hours_start || '');
  const [quietHoursEnd, setQuietHoursEnd] = useState(preferences.quiet_hours_end || '');

  const handleQuietHoursChange = () => {
    updatePreferences({
      quiet_hours_start: quietHoursStart || null,
      quiet_hours_end: quietHoursEnd || null,
    });
  };

  const handleToggleSubscription = () => {
    if (isSubscribed) {
      unsubscribeFromPushNotifications();
    } else {
      subscribeToPushNotifications();
    }
  };

  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Push notifications are not supported in this browser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <BellOff className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Please try using a modern browser like Chrome, Firefox, or Edge to enable notifications.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Get timely alerts for your health plan, appointments, and more
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-y-1">
          <div className="flex items-center space-x-3">
            {isSubscribed ? (
              <BellRing className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed
                  ? "You're receiving notifications"
                  : "You're not receiving notifications"}
              </p>
            </div>
          </div>
          <Button
            variant={isSubscribed ? "outline" : "default"}
            onClick={handleToggleSubscription}
            disabled={isLoading || permissionState === 'denied'}
          >
            {isLoading
              ? "Processing..."
              : isSubscribed
              ? "Disable"
              : "Enable"}
          </Button>
        </div>

        {permissionState === 'denied' && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Notifications are blocked. Please update your browser settings to allow notifications.
          </div>
        )}

        {isSubscribed && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-medium">Notification Types</h3>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="health-plan">Health Plan Reminders</Label>
                  <Switch
                    id="health-plan"
                    checked={preferences.health_plan_enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences({ health_plan_enabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="appointments">Appointment Reminders</Label>
                  <Switch
                    id="appointments"
                    checked={preferences.appointment_enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences({ appointment_enabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="medication">Medication Reminders</Label>
                  <Switch
                    id="medication"
                    checked={preferences.medication_enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences({ medication_enabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="general">General Updates</Label>
                  <Switch
                    id="general"
                    checked={preferences.general_enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences({ general_enabled: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <h3 className="font-medium">Quiet Hours</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Set a time range when you don't want to be disturbed
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <TimePickerInput
                    id="quiet-start"
                    value={quietHoursStart}
                    onChange={setQuietHoursStart}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End Time</Label>
                  <TimePickerInput
                    id="quiet-end"
                    value={quietHoursEnd}
                    onChange={setQuietHoursEnd}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuietHoursChange}
                disabled={!quietHoursStart || !quietHoursEnd}
                className="mt-2"
              >
                Save Quiet Hours
              </Button>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/50 px-6 py-3">
        <p className="text-xs text-muted-foreground">
          Notifications are delivered according to your preferences and may be affected by your device settings.
        </p>
      </CardFooter>
    </Card>
  );
};
