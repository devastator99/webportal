
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Users, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
        <div className="flex gap-2">
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
      
      <Tabs defaultValue="all" value={roleFilter} onValueChange={setRoleFilter}>
        <div className="mb-4">
          <TabsList className="w-full grid grid-cols-5 gap-1">
            <TabsTrigger className="flex-1" value="all">All</TabsTrigger>
            <TabsTrigger className="flex-1" value="patient">Patients</TabsTrigger>
            <TabsTrigger className="flex-1" value="doctor">Doctors</TabsTrigger>
            <TabsTrigger className="flex-1" value="nutritionist">Nutritionists</TabsTrigger>
            <TabsTrigger className="flex-1" value="administrator">Admins</TabsTrigger>
          </TabsList>
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
      </Tabs>
    </div>
  );
};
