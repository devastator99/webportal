
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { RegistrationProgress } from "@/types/registration";

export const RegistrationProgressReport = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingTasks, setIsProcessingTasks] = useState(false);
  
  const { data, isLoading, error, refetch } = useQuery<RegistrationProgress[]>({
    queryKey: ["registration_progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registration_progress')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Data refreshed",
        description: "Latest registration progress loaded"
      });
    } catch (error: any) {
      toast({
        title: "Error refreshing data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleProcessTasks = async () => {
    setIsProcessingTasks(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-registration-tasks', {
        body: {}
      });
      
      if (error) throw error;
      
      toast({
        title: "Tasks processed",
        description: data.message || "Registration tasks processed successfully"
      });
      
      // Refresh data after processing
      await refetch();
    } catch (error: any) {
      toast({
        title: "Error processing tasks",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessingTasks(false);
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };
  
  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fully_registered':
        return <Badge className="bg-green-500">Complete</Badge>;
      case 'care_team_assigned':
        return <Badge className="bg-blue-500">Team Assigned</Badge>;
      case 'payment_complete':
        return <Badge className="bg-yellow-500">Payment Complete</Badge>;
      case 'payment_pending':
        return <Badge className="bg-gray-500">Payment Pending</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Registration Progress</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessTasks}
            disabled={isProcessingTasks}
          >
            {isProcessingTasks ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Process Tasks
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-md bg-red-50 p-4 my-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  Error loading registration data: {(error as Error).message}
                </p>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Care Team</TableHead>
                  <TableHead className="text-center">Chat Room</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.first_name} {item.last_name}
                    </TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>
                      {getStatusBadge(item.registration_status || 'payment_pending')}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusIcon(item.care_team_assigned)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusIcon(item.chat_room_created)}
                    </TableCell>
                    <TableCell>{formatTimeAgo(item.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            No registration data found
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationProgressReport;
