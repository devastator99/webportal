
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  selected?: boolean;
}

export const DeleteSpecificUser = () => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState('mihir.chandra@gmail.com');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: usersData, error } = await supabase.functions.invoke('admin-get-users', {
        body: {}
      });

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      if (usersData?.users) {
        setUsers(usersData.users);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(`Failed to fetch users: ${error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const selectAllUsers = () => {
    const allUserIds = users.filter(u => u.id !== user?.id).map(u => u.id);
    setSelectedUsers(allUserIds);
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

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
      fetchAllUsers(); // Refresh the list
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`Delete failed: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} selected user(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const userId of selectedUsers) {
        try {
          const { data, error } = await supabase.functions.invoke('admin-delete-user', {
            body: {
              user_id: userId,
              admin_id: user?.id
            }
          });

          if (error) {
            throw new Error(`Delete failed: ${error.message}`);
          }

          if (!data.success) {
            throw new Error(data.error || 'Delete operation failed');
          }

          successCount++;
        } catch (error: any) {
          console.error(`Error deleting user ${userId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} user(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} user(s)`);
      }

      setSelectedUsers([]);
      fetchAllUsers(); // Refresh the list
      
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast.error(`Bulk delete failed: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Single User Deletion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Specific User
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

      {/* Bulk User Deletion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk User Deletion
          </CardTitle>
          <CardDescription>
            Select multiple users from the list below for bulk deletion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Bulk deletion will permanently delete all selected users and their associated data.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              onClick={fetchAllUsers}
              disabled={loadingUsers}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button
              onClick={selectAllUsers}
              disabled={loadingUsers || users.length === 0}
              variant="outline"
              size="sm"
            >
              Select All
            </Button>
            <Button
              onClick={deselectAllUsers}
              disabled={selectedUsers.length === 0}
              variant="outline"
              size="sm"
            >
              Deselect All
            </Button>
            <Button
              onClick={deleteSelectedUsers}
              disabled={isDeleting || selectedUsers.length === 0}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedUsers.length})
            </Button>
          </div>

          {loadingUsers ? (
            <div className="text-center py-4">Loading users...</div>
          ) : (
            <div className="border rounded-lg">
              <div className="max-h-60 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No users found</div>
                ) : (
                  <div className="space-y-2 p-4">
                    {users.map((userItem) => (
                      <div
                        key={userItem.id}
                        className={`flex items-center space-x-3 p-2 rounded ${
                          userItem.id === user?.id ? 'bg-gray-100 opacity-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Checkbox
                          checked={selectedUsers.includes(userItem.id)}
                          onCheckedChange={() => toggleUserSelection(userItem.id)}
                          disabled={userItem.id === user?.id || isDeleting}
                        />
                        <div className="flex-1">
                          <span className="text-sm">{userItem.email}</span>
                          {userItem.id === user?.id && (
                            <span className="text-xs text-gray-500 ml-2">(Current User)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedUsers.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedUsers.length} user(s) selected for deletion
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
