
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const AuthDebugger = () => {
  const { user, userRole, isLoading, refreshUser } = useAuth();
  
  const handleRefresh = async () => {
    await refreshUser();
  };
  
  return (
    <Card className="border-red-500 max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Auth Debugger</span>
          <Badge variant={isLoading ? "secondary" : "outline"}>
            {isLoading ? "Loading..." : "Ready"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">User Status:</p>
          <Badge variant={user ? "success" : "destructive"}>
            {user ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>
        
        {user && (
          <>
            <div>
              <p className="text-sm font-medium mb-1">User ID:</p>
              <p className="text-xs text-muted-foreground break-all">{user.id}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">Email:</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">Role:</p>
              {userRole ? (
                <Badge variant="outline" className="capitalize">
                  {userRole}
                </Badge>
              ) : (
                <Badge variant="destructive">Not Assigned</Badge>
              )}
            </div>
          </>
        )}
        
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh User Data
        </Button>
      </CardContent>
    </Card>
  );
};
