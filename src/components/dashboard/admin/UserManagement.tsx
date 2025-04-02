
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
      
      // Call RPC function to get users with roles
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
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
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
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="patient">Patients</TabsTrigger>
            <TabsTrigger value="doctor">Doctors</TabsTrigger>
            <TabsTrigger value="nutritionist">Nutritionists</TabsTrigger>
            <TabsTrigger value="administrator">Admins</TabsTrigger>
          </TabsList>
          
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
        </Tabs>
      </CardContent>
    </Card>
  );
};
