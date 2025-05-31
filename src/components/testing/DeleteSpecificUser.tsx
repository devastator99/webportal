
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const DeleteSpecificUser = () => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState('mihir.chandra@gmail.com');
  const [confirmEmail, setConfirmEmail] = useState('');

  const deleteSpecificUser = async () => {
    if (emailToDelete !== confirmEmail) {
      toast.error('Email confirmation does not match');
      return;
    }

    if (!emailToDelete.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsDeleting(true);
    try {
      // First, get all users to find the one with this email
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-get-users', {
        body: {}
      });

      if (usersError) {
        throw new Error(`Failed to get users: ${usersError.message}`);
      }

      const targetUser = usersData?.users?.find((u: any) => u.email === emailToDelete);
      
      if (!targetUser) {
        toast.error(`User with email ${emailToDelete} not found`);
        return;
      }

      console.log(`Found user to delete:`, targetUser);

      // Delete the user using the admin delete function
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: {
          user_id: targetUser.id,
          admin_id: user?.id
        }
      });

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Delete operation failed');
      }

      toast.success(`Successfully deleted user: ${emailToDelete}`);
      setEmailToDelete('');
      setConfirmEmail('');
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`Delete failed: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Delete Specific Test User
        </CardTitle>
        <CardDescription>
          Remove a specific test user from both database and auth
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This will permanently delete the user and all associated data 
            including profiles, roles, assignments, and auth records.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailToDelete">Email to Delete</Label>
            <Input
              id="emailToDelete"
              type="email"
              value={emailToDelete}
              onChange={(e) => setEmailToDelete(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmEmail">Confirm Email</Label>
            <Input
              id="confirmEmail"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Retype the email to confirm"
            />
          </div>

          <Button
            onClick={deleteSpecificUser}
            disabled={isDeleting || !emailToDelete || !confirmEmail || emailToDelete !== confirmEmail}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete User Permanently'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
