
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface UserItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
}

export const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log("Fetching users...");
      
      // Get all profiles first
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');
      
      if (profilesError) {
        console.error("Profiles query error:", profilesError);
        throw profilesError;
      }
      
      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }
      
      console.log("Profiles data:", profilesData);
      
      // Get user roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
        
      if (rolesError) {
        console.error("Roles query error:", rolesError);
        throw rolesError;
      }
      
      // Instead of using the RPC function, get emails directly from auth.users 
      // using the admin-provided Edge Function
      const { data: authUsers, error: authUsersError } = await supabase.functions.invoke(
        'admin-get-users',
        { body: { userIds: profilesData.map(p => p.id) } }
      );
      
      if (authUsersError) {
        console.error("Auth users fetch error:", authUsersError);
        // Continue even if this fails, we'll just show without emails
      }
      
      console.log("Auth users data:", authUsers);
      
      // Create a map of user_id to email
      const emailMap = new Map();
      if (authUsers && Array.isArray(authUsers.users)) {
        authUsers.users.forEach(user => {
          if (user.id && user.email) {
            emailMap.set(user.id, user.email);
          }
        });
      }
      
      // Create a map of user_id to role
      const roleMap = new Map();
      if (rolesData) {
        rolesData.forEach(role => {
          if (role.user_id && role.role) {
            roleMap.set(role.user_id, role.role);
          }
        });
      }
      
      // Combine the data
      const formattedUsers: UserItem[] = profilesData.map(profile => {
        return {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: emailMap.get(profile.id) || 'No email',
          role: roleMap.get(profile.id) || 'No role'
        };
      });
      
      console.log("Formatted users:", formattedUsers);
      setUsers(formattedUsers);
      
      toast.success("User data refreshed");
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(`Error loading users: ${error.message}`);
    } finally {
      setLoading(false);
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
              <SelectItem value="reception">Reception</SelectItem>
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
        {loading ? (
          <div className="py-10">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <Table>
            <TableCaption>
              {filteredUsers.length > 0 ? `${filteredUsers.length} users found` : "No users found"}
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
                  <TableCell colSpan={3} className="text-center py-8">
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
