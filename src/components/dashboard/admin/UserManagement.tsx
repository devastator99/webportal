
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminDeleteUser, supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Users, RefreshCw, Trash2, AlertCircle, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
}

export const UserManagement = () => {
  const { toast: uiToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [unknownUsersCount, setUnknownUsersCount] = useState(0);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log("Fetching users with roles...");
      
      // Use type assertion to bypass TypeScript's strict checking for RPC function names
      const { data, error } = await (supabase.rpc as any)('get_users_with_roles');
      
      if (error) {
        console.error("RPC error:", error);
        throw error;
      }
      
      console.log("Users data received:", data);
      // Ensure we properly type the data as UserItem[]
      setUsers((data || []) as UserItem[]);
      
      // Count unknown users
      const unknownUsers = data?.filter(
        (user: UserItem) => user.first_name === 'unknown' || user.first_name === null || user.first_name === ''
      ) || [];
      setUnknownUsersCount(unknownUsers.length);
      
      toast.success("User data refreshed");
    } catch (error: any) {
      console.error("Error fetching users:", error);
      uiToast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteUnknownUsers = async () => {
    if (!user?.id) {
      toast.error("Admin ID is required");
      return;
    }

    setDeleteLoading(true);
    try {
      // Filter users with unknown or empty first names
      const unknownUsers = users.filter(
        user => user.first_name === 'unknown' || user.first_name === null || user.first_name === ''
      );
      
      if (unknownUsers.length === 0) {
        toast.info("No unknown users to delete");
        setShowDeleteConfirmation(false);
        return;
      }
      
      // Delete each user one by one using the adminDeleteUser function
      let successCount = 0;
      let failCount = 0;
      
      for (const unknownUser of unknownUsers) {
        try {
          console.log(`Attempting to delete user ${unknownUser.id} with admin ${user.id}`);
          const result = await adminDeleteUser(unknownUser.id, user.id);
          
          if (result.success) {
            successCount++;
          } else {
            console.error(`Failed to delete user ${unknownUser.id}:`, result.error);
            failCount++;
          }
        } catch (error) {
          console.error(`Error deleting user ${unknownUser.id}:`, error);
          failCount++;
        }
      }
      
      // Refresh the user list
      await fetchUsers();
      
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} unknown users`);
      }
      
      if (failCount > 0) {
        uiToast({
          title: "Some deletions failed",
          description: `Failed to delete ${failCount} users. Check console for details.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error deleting unknown users:", error);
      uiToast({
        title: "Error deleting users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirmation(false);
    }
  };
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="patient">Patients</SelectItem>
              <SelectItem value="doctor">Doctors</SelectItem>
              <SelectItem value="nutritionist">Nutritionists</SelectItem>
              <SelectItem value="administrator">Admins</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          
          {unknownUsersCount > 0 && (
            <Button 
              variant="destructive" 
              className="flex items-center gap-2"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              <UserX className="h-4 w-4" />
              Delete Unknown ({unknownUsersCount})
            </Button>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 border rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableCaption>
            {loading ? "Loading users..." : `${filteredUsers.length} users found`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.first_name || user.last_name 
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : 'Unknown'}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  {loading ? "Loading..." : "No users found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Confirmation Dialog for Deleting Unknown Users */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {unknownUsersCount} users with unknown or empty names? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmation(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteLoading ? undefined : deleteUnknownUsers}
              disabled={deleteLoading}
              className="flex items-center gap-2"
            >
              {deleteLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
