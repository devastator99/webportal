
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const UserPhoneChecker = () => {
  const [email, setEmail] = useState('mihir.chandra@gmail.com');
  const [isChecking, setIsChecking] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();

  const checkUserPhone = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    setUserData(null);

    try {
      console.log("Checking phone number for email:", email);
      
      // Get user ID by email using the existing function
      const { data: userId, error: userIdError } = await supabase.rpc('get_user_id_by_email', {
        user_email: email
      });

      if (userIdError) {
        console.error("Error getting user ID:", userIdError);
        throw new Error(`Failed to find user: ${userIdError.message}`);
      }

      if (!userId) {
        throw new Error("User not found with this email address");
      }

      console.log("Found user ID:", userId);

      // Get profile data including phone
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, created_at, registration_status')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Error getting profile:", profileError);
        throw new Error(`Failed to get profile: ${profileError.message}`);
      }

      // Get user role
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      // Get notification logs for this user (WhatsApp notifications)
      const { data: notifications, error: notifError } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'whatsapp')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get registration tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('registration_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('task_type', 'send_welcome_notification')
        .order('created_at', { ascending: false })
        .limit(3);

      setUserData({
        profile,
        role: userRole?.role || 'No role found',
        notifications: notifications || [],
        tasks: tasks || []
      });

      toast({
        title: "User Found",
        description: `Found data for ${profile.first_name} ${profile.last_name}`,
      });

    } catch (error: any) {
      console.error('Error checking user phone:', error);
      toast({
        title: "Check Failed",
        description: error.message || "Failed to check user phone number",
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
          User Phone Number Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={checkUserPhone}
            disabled={isChecking}
          >
            <Search className="h-4 w-4 mr-2" />
            {isChecking ? "Checking..." : "Check Phone"}
          </Button>
        </div>

        {userData && (
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Phone className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <div><strong>Name:</strong> {userData.profile.first_name} {userData.profile.last_name}</div>
                  <div><strong>Email:</strong> {email}</div>
                  <div><strong>Phone Number:</strong> {userData.profile.phone || 'No phone number stored'}</div>
                  <div><strong>Role:</strong> {userData.role}</div>
                  <div><strong>Registration Status:</strong> {userData.profile.registration_status || 'Not set'}</div>
                  <div><strong>Created:</strong> {new Date(userData.profile.created_at).toLocaleString()}</div>
                </div>
              </AlertDescription>
            </Alert>

            {userData.notifications.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recent WhatsApp Notifications:</h4>
                {userData.notifications.map((notif: any) => (
                  <div key={notif.id} className="bg-gray-50 p-3 rounded text-sm">
                    <div><strong>Status:</strong> {notif.status}</div>
                    <div><strong>Title:</strong> {notif.title}</div>
                    <div><strong>Sent:</strong> {new Date(notif.created_at).toLocaleString()}</div>
                    {notif.error && <div className="text-red-600"><strong>Error:</strong> {notif.error}</div>}
                    {notif.data && (
                      <div><strong>Data:</strong> <pre className="text-xs mt-1">{JSON.stringify(notif.data, null, 2)}</pre></div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {userData.tasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Registration Notification Tasks:</h4>
                {userData.tasks.map((task: any) => (
                  <div key={task.id} className="bg-gray-50 p-3 rounded text-sm">
                    <div><strong>Status:</strong> {task.status}</div>
                    <div><strong>Created:</strong> {new Date(task.created_at).toLocaleString()}</div>
                    <div><strong>Updated:</strong> {new Date(task.updated_at).toLocaleString()}</div>
                    {task.error_details && (
                      <div className="text-red-600"><strong>Error:</strong> {JSON.stringify(task.error_details, null, 2)}</div>
                    )}
                    {task.result_payload && (
                      <div><strong>Result:</strong> <pre className="text-xs mt-1">{JSON.stringify(task.result_payload, null, 2)}</pre></div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {userData.profile.phone && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  <strong>WhatsApp Message Details:</strong><br/>
                  • TO: whatsapp:{userData.profile.phone}<br/>
                  • FROM: whatsapp:+919263865032 (Twilio configured number)<br/>
                  • Formatted Number: {userData.profile.phone}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
