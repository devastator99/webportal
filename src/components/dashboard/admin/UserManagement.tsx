
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, UserPlus, Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";

interface UserItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  selected?: boolean;
}

export const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log("Fetching users...");
      
      // Get all auth users and their emails via the admin-get-users edge function
      const { data: authUsers, error: authUsersError } = await supabase.functions.invoke(
        'admin-get-users',
        { body: {} }
      );
      
      if (authUsersError) {
        console.error("Auth users fetch error:", authUsersError);
        throw authUsersError;
      }
      
      console.log("Auth users data:", authUsers);
      
      if (!authUsers || !Array.isArray(authUsers.users)) {
        throw new Error("Invalid response from admin-get-users");
      }
      
      // Create a map of user profiles and roles
      const formattedUsers: UserItem[] = [];
      
      // Get profiles directly - this should not have recursion issues
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      
      if (profilesError) {
        console.error("Profiles fetch error:", profilesError);
        throw profilesError;
      }
      
      // Create a map of profile data
      const profileMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          if (profile.id) {
            profileMap.set(profile.id, {
              first_name: profile.first_name,
              last_name: profile.last_name
            });
          }
        });
      }
      
      // Get roles from the edge function not directly
      const { data: rolesData, error: rolesError } = await supabase.functions.invoke(
        'admin-get-user-roles',
        { body: {} }
      );
      
      if (rolesError) {
        console.error("Roles fetch error:", rolesError);
        throw rolesError;
      }
      
      // Create a map of user roles
      const roleMap = new Map();
      if (rolesData && Array.isArray(rolesData.roles)) {
        rolesData.roles.forEach(roleInfo => {
          if (roleInfo.user_id && roleInfo.role) {
            roleMap.set(roleInfo.user_id, roleInfo.role);
          }
        });
      }
      
      // Combine all the data
      for (const authUser of authUsers.users) {
        const userId = authUser.id;
        const profile = profileMap.get(userId) || {};
        
        formattedUsers.push({
          id: userId,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: authUser.email || 'No email',
          role: roleMap.get(userId) || 'No role'
        });
      }
      
      console.log("Formatted users:", formattedUsers);
      setUsers(formattedUsers);
      setSelectedUsers([]);
      
      toast.success("User data refreshed");
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(`Error loading users: ${error.message}`);
    } finally {
      setLoading(false);
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
  
  const handleDeleteSelected = async () => {
    if (!selectedUsers.length) {
      toast.error("No users selected");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} selected user(s)?`)) {
      return;
    }
    
    setDeleting(true);
    try {
      for (const userId of selectedUsers) {
        // Skip current user
        if (userId === user?.id) {
          toast.error("Cannot delete your own account");
          continue;
        }
        
        const { data, error } = await supabase.functions.invoke('admin-delete-user', { 
          body: { 
            user_id: userId,
            admin_id: user?.id
          } 
        });
        
        if (error) {
          console.error("Error deleting user:", error);
          toast.error(`Failed to delete user: ${error.message}`);
        }
      }
      
      toast.success("Successfully deleted selected users");
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error("Error in delete operation:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setDeleting(false);
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

  // Responsive layout adjustments
  const isSmallScreen = isMobile || (isIPad && window.innerWidth < 768);

  return (
    <div className="space-y-4">
      {/* Controls section - stack on mobile/small screens, row on larger screens */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={`flex ${isSmallScreen ? 'flex-col' : 'items-center'} gap-3`}>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className={`${isSmallScreen ? 'w-full' : 'w-[150px]'}`}>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="patient">Patients</SelectItem>
              <SelectItem value="doctor">Doctors</SelectItem>
              <SelectItem value="nutritionist">Nutritionists</SelectItem>
              <SelectItem value="administrator">Admins</SelectItem>
              <SelectItem value="reception">Reception</SelectItem>
            </SelectContent>
          </Select>
          
          <div className={`flex ${isSmallScreen ? 'flex-col w-full' : 'flex-row'} gap-2`}>
            <Button 
              variant="outline" 
              onClick={fetchUsers}
              disabled={loading}
              className={`flex items-center gap-2 ${isSmallScreen ? 'w-full' : ''}`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleDeleteSelected}
              disabled={deleting || selectedUsers.length === 0}
              className={`flex items-center gap-2 ${isSmallScreen ? 'w-full' : ''}`}
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      </div>
      
      {/* Table section with responsive adjustments */}
      <div className="bg-white dark:bg-gray-800 border rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-10">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                {filteredUsers.length > 0 ? `${filteredUsers.length} users found` : "No users found"}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Select</TableHead>
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
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                          id={`select-${user.id}`}
                          disabled={user.id === user?.id} // Prevent selecting current user
                        />
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : 'Unknown'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};
