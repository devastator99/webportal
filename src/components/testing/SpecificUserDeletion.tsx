
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const SpecificUserDeletion = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionComplete, setDeletionComplete] = useState(false);
  const { user } = useAuth();
  const targetEmail = 'mihir.chandra@gmail.com';

  const deleteSpecificUser = async () => {
    if (!user?.id) {
      toast.error('You must be logged in as an admin');
      return;
    }

    setIsDeleting(true);
    try {
      // First get the user ID by email
      const { data: getUserData, error: getUserError } = await supabase.functions.invoke(
        'admin-get-users',
        { body: {} }
      );

      if (getUserError) {
        throw new Error(`Failed to get users: ${getUserError.message}`);
      }

      const targetUser = getUserData.users?.find((u: any) => u.email === targetEmail);
      
      if (!targetUser) {
        toast.error(`User with email ${targetEmail} not found`);
        return;
      }

      console.log(`Found user to delete: ${targetUser.id} (${targetEmail})`);

      // Delete the user using the admin delete function
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: {
          user_id: targetUser.id,
          admin_id: user.id
        }
      });

      if (error) {
        throw new Error(`Deletion failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(`Deletion failed: ${data.error}`);
      }

      setDeletionComplete(true);
      toast.success(`Successfully deleted user ${targetEmail}`);
    } catch (error: any) {
      console.error('Deletion error:', error);
      toast.error(`Deletion failed: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetView = () => {
    setDeletionComplete(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Delete Specific User
        </CardTitle>
        <CardDescription>
          Delete all data for user: {targetEmail}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This will permanently delete all data for the user {targetEmail} including:
            profiles, user roles, registration tasks, patient assignments, medical records, chat messages, and the auth account.
          </AlertDescription>
        </Alert>

        {!deletionComplete ? (
          <div className="flex gap-4">
            <Button
              onClick={deleteSpecificUser}
              disabled={isDeleting}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting User...' : `Delete ${targetEmail}`}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                User {targetEmail} has been successfully deleted from the system.
              </AlertDescription>
            </Alert>

            <Button
              onClick={resetView}
              variant="outline"
              className="flex items-center gap-2"
            >
              Reset View
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
