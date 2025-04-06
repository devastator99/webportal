
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, RefreshCw, Edit, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log("Fetching users with roles...");
      
      // Make sure to call the RPC function correctly
      const { data, error } = await supabase.rpc('get_users_with_roles');
      
      if (error) {
        console.error("RPC error:", error);
        throw error;
      }
      
      console.log("Users data received:", data);
      setUsers(data || []);
      
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
  
  const deleteUser = async (userId: string) => {
    if (!user?.id) {
      toast.error("You must be logged in to perform this action");
      return;
    }
    
    setActionInProgress(true);
    try {
      // Call edge function to delete user
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { 
          user_id: userId,
          admin_id: user.id
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Refresh user list
      await fetchUsers();
      toast.success("User successfully deleted");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      uiToast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionInProgress(false);
      setDeleteDialogOpen(false);
    }
  };
  
  const handleDeleteClick = (user: UserItem) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
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
              <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(user)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  {loading ? "Loading..." : "No users found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete User</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete user 
            <span className="font-medium"> {selectedUser?.email}</span>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={actionInProgress}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedUser && deleteUser(selectedUser.id)}
              disabled={actionInProgress}
            >
              {actionInProgress ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
