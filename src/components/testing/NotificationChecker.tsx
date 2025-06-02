
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, Phone, MessageSquare, Bell, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NotificationLog {
  id: string;
  action: string;
  level: string;
  message: string;
  details: any;
  created_at: string;
}

interface NotificationStatus {
  email_notifications: NotificationLog[];
  sms_notifications: NotificationLog[];
  whatsapp_notifications: NotificationLog[];
  push_notifications: NotificationLog[];
  registration_logs: NotificationLog[];
  welcome_notifications: NotificationLog[];
}

export const NotificationChecker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationStatus | null>(null);

  const checkNotifications = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user logged in",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get all notification-related system logs for the current user
      const { data: logs, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('user_id', user.id)
        .or('action.ilike.%notification%,action.ilike.%email%,action.ilike.%sms%,action.ilike.%whatsapp%,action.ilike.%welcome%,action.ilike.%registration%')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      // Categorize notifications
      const categorized: NotificationStatus = {
        email_notifications: logs?.filter(log => 
          log.action.includes('email') || 
          log.message.toLowerCase().includes('email')
        ) || [],
        sms_notifications: logs?.filter(log => 
          log.action.includes('sms') || 
          log.message.toLowerCase().includes('sms') ||
          log.message.toLowerCase().includes('text')
        ) || [],
        whatsapp_notifications: logs?.filter(log => 
          log.action.includes('whatsapp') || 
          log.message.toLowerCase().includes('whatsapp')
        ) || [],
        push_notifications: logs?.filter(log => 
          log.action.includes('push') || 
          log.message.toLowerCase().includes('push')
        ) || [],
        registration_logs: logs?.filter(log => 
          log.action.includes('registration')
        ) || [],
        welcome_notifications: logs?.filter(log => 
          log.action.includes('welcome') || 
          log.message.toLowerCase().includes('welcome')
        ) || []
      };

      setNotifications(categorized);
      
      toast({
        title: "Notification Check Complete",
        description: `Found ${logs?.length || 0} notification-related logs`,
      });

    } catch (error: any) {
      console.error('Error checking notifications:', error);
      toast({
        title: "Check Failed",
        description: error.message || "Failed to check notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (level: string, hasLogs: boolean) => {
    if (!hasLogs) return <Clock className="h-4 w-4 text-gray-400" />;
    if (level === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    if (level === 'info') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <Bell className="h-4 w-4 text-blue-500" />;
  };

  const formatLogLevel = (level: string) => {
    const colors = {
      error: 'text-red-600',
      warn: 'text-yellow-600', 
      info: 'text-blue-600',
      debug: 'text-gray-600'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600';
  };

  const renderNotificationCategory = (
    title: string, 
    icon: React.ReactNode, 
    logs: NotificationLog[]
  ) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title} ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">No {title.toLowerCase()} found</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={log.id || index} className="p-2 border rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{log.action}</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.level, true)}
                    <span className={`${formatLogLevel(log.level)} uppercase text-xs`}>
                      {log.level}
                    </span>
                  </div>
                </div>
                <div className="text-gray-600 mb-1">{log.message}</div>
                {log.details && (
                  <div className="bg-gray-50 p-1 rounded text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription>
          Please log in to check notification status.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Status Checker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current User: {user.email}</p>
                <p className="text-sm text-gray-600">User ID: {user.id}</p>
              </div>
              <Button 
                onClick={checkNotifications} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Check Notifications
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {notifications && (
        <div className="space-y-4">
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Notification Summary:</strong> Found {
                notifications.email_notifications.length + 
                notifications.sms_notifications.length + 
                notifications.whatsapp_notifications.length + 
                notifications.push_notifications.length +
                notifications.welcome_notifications.length
              } total notification logs for this user.
            </AlertDescription>
          </Alert>

          {renderNotificationCategory(
            "Welcome Notifications",
            <Mail className="h-4 w-4" />,
            notifications.welcome_notifications
          )}

          {renderNotificationCategory(
            "Email Notifications", 
            <Mail className="h-4 w-4" />,
            notifications.email_notifications
          )}

          {renderNotificationCategory(
            "SMS Notifications",
            <Phone className="h-4 w-4" />,
            notifications.sms_notifications
          )}

          {renderNotificationCategory(
            "WhatsApp Notifications",
            <MessageSquare className="h-4 w-4" />,
            notifications.whatsapp_notifications
          )}

          {renderNotificationCategory(
            "Push Notifications",
            <Bell className="h-4 w-4" />,
            notifications.push_notifications
          )}

          {renderNotificationCategory(
            "Registration Process Logs",
            <CheckCircle2 className="h-4 w-4" />,
            notifications.registration_logs
          )}
        </div>
      )}
    </div>
  );
};
