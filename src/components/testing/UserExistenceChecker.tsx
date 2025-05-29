
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export const UserExistenceChecker: React.FC = () => {
  const [email, setEmail] = useState("mihir.chandra@gmail.com");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkUserExists = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    setResults(null);
    
    try {
      console.log("Checking if user exists:", email);
      
      // Check multiple places for user existence
      const checks = {
        authUsers: false,
        profiles: false,
        userRoles: false,
        authUsersCount: 0,
        profilesCount: 0,
        userRolesCount: 0,
        userId: null,
        profileData: null,
        roleData: null
      };

      // 1. Check auth.users via RPC function
      try {
        const { data: userExists, error: rpcError } = await supabase
          .rpc('check_user_exists', { p_email: email });
        
        if (!rpcError) {
          checks.authUsers = userExists;
        }
        console.log("Auth users check:", userExists, rpcError);
      } catch (error) {
        console.error("Error checking auth.users:", error);
      }

      // 2. Try to get user ID from auth metadata (this might fail if user doesn't exist)
      try {
        const { data: userData, error: userError } = await supabase.functions.invoke(
          'verify-users-exist',
          { body: { emails: [email] } }
        );
        
        console.log("Verify users exist result:", userData, userError);
      } catch (error) {
        console.error("Error verifying user:", error);
      }

      // 3. Check profiles table directly
      try {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1000); // Get all profiles to search
        
        if (!profileError && profiles) {
          // We can't directly filter by email in profiles, so we check all
          checks.profilesCount = profiles.length;
          console.log("Total profiles found:", profiles.length);
          
          // Try to find a profile that might match
          const matchingProfile = profiles.find(p => 
            p.first_name?.toLowerCase() === 'mihir' || 
            p.last_name?.toLowerCase() === 'chandra'
          );
          
          if (matchingProfile) {
            checks.profiles = true;
            checks.profileData = matchingProfile;
            checks.userId = matchingProfile.id;
          }
        }
      } catch (error) {
        console.error("Error checking profiles:", error);
      }

      // 4. If we found a user ID, check user_roles
      if (checks.userId) {
        try {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', checks.userId)
            .single();
          
          if (!roleError && roleData) {
            checks.userRoles = true;
            checks.roleData = roleData;
          }
        } catch (error) {
          console.error("Error checking user roles:", error);
        }
      }

      // 5. Check all user_roles
      try {
        const { data: allRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*');
        
        if (!rolesError && allRoles) {
          checks.userRolesCount = allRoles.length;
        }
      } catch (error) {
        console.error("Error checking all user roles:", error);
      }

      setResults(checks);
      
    } catch (error: any) {
      console.error("Error checking user existence:", error);
      setResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>User Existence Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label>Email to check:</label>
          <div className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
            <Button onClick={checkUserExists} disabled={isLoading}>
              {isLoading ? "Checking..." : "Check User"}
            </Button>
          </div>
        </div>

        {results && (
          <Alert>
            <AlertDescription>
              <div className="space-y-3">
                <div><strong>Email Checked:</strong> {email}</div>
                
                {results.error ? (
                  <div className="text-red-600"><strong>Error:</strong> {results.error}</div>
                ) : (
                  <div className="space-y-2">
                    <div><strong>Auth Users Exists:</strong> {results.authUsers ? 'Yes' : 'No'}</div>
                    <div><strong>Profile Exists:</strong> {results.profiles ? 'Yes' : 'No'}</div>
                    <div><strong>User Role Exists:</strong> {results.userRoles ? 'Yes' : 'No'}</div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <div><strong>Database Counts:</strong></div>
                      <div>Total Profiles: {results.profilesCount}</div>
                      <div>Total User Roles: {results.userRolesCount}</div>
                    </div>
                    
                    {results.userId && (
                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <div><strong>Found User ID:</strong> {results.userId}</div>
                      </div>
                    )}
                    
                    {results.profileData && (
                      <div className="mt-4 p-3 bg-green-50 rounded">
                        <div><strong>Profile Data:</strong></div>
                        <div>Name: {results.profileData.first_name} {results.profileData.last_name}</div>
                        <div>Phone: {results.profileData.phone}</div>
                        <div>Registration Status: {results.profileData.registration_status}</div>
                      </div>
                    )}
                    
                    {results.roleData && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded">
                        <div><strong>Role Data:</strong></div>
                        <div>Role: {results.roleData.role}</div>
                        <div>Created: {new Date(results.roleData.created_at).toLocaleString()}</div>
                      </div>
                    )}
                    
                    <div className="mt-4 p-3 bg-gray-100 rounded">
                      <div><strong>Conclusion:</strong></div>
                      {!results.authUsers && !results.profiles && !results.userRoles ? (
                        <div className="text-green-600">✅ User appears to be completely deleted</div>
                      ) : (
                        <div className="text-orange-600">⚠️ User still exists in some tables</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
