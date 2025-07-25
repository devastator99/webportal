
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, AlertTriangle, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TaskData {
  id: string;
  task_type: string;
  status: string;
  priority: number;
  retry_count: number;
  created_at: string;
  updated_at: string;
  next_retry_at: string;
  error_details: any;
  result_payload: any;
}

interface DiagnosticResult {
  user_id: string;
  timestamp: string;
  profile: {
    exists: boolean;
    registration_status: string;
    registration_completed_at: string | null;
    profile_created_at: string;
    profile_updated_at: string;
    name: string;
    phone: string;
  };
  tasks: {
    total_count: number;
    tasks: TaskData[];
  };
  care_team_assignment: {
    exists: boolean;
    doctor_assigned: boolean;
    nutritionist_assigned: boolean;
    assignment_created_at: string | null;
    assignment_id: string | null;
  };
  chat_room: {
    exists: boolean;
    room_id: string | null;
    room_name: string | null;
    room_type: string | null;
    is_active: boolean;
    member_count: number;
    room_created_at: string | null;
  };
  payments: {
    total_invoices: number;
    payment_history: any[];
  };
  system_logs: {
    recent_log_count: number;
    logs: any[];
  };
  analysis: {
    registration_flow_complete: boolean;
    stuck_in_payment_pending: boolean;
    has_failed_tasks: boolean;
    has_pending_tasks: boolean;
    task_processing_issues: boolean;
  };
}

export const RegistrationDiagnostic = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('66aa639b-38ce-4092-a700-f115b9fcce38'); // Pre-fill with the problematic user
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [taskSummary, setTaskSummary] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);

  const runDiagnostic = async () => {
    if (!userId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Run diagnostic for specific user
      const { data: diagnosticData, error: diagnosticError } = await supabase
        .rpc('diagnose_registration_state', { p_user_id: userId.trim() });

      if (diagnosticError) {
        throw diagnosticError;
      }

      // Get overall task summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_registration_task_summary');

      if (summaryError) {
        console.warn('Failed to get task summary:', summaryError);
      }

      // Get recent system logs for this user
      const { data: logsData, error: logsError } = await supabase
        .from('system_logs')
        .select('*')
        .eq('user_id', userId.trim())
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsError) {
        console.warn('Failed to get system logs:', logsError);
      }

      setResult(diagnosticData);
      setTaskSummary(summaryData || []);
      setSystemLogs(logsData || []);
      
      toast({
        title: "Diagnostic Complete",
        description: "Registration analysis completed successfully",
      });

    } catch (error: any) {
      console.error('Diagnostic error:', error);
      toast({
        title: "Diagnostic Failed",
        description: error.message || "Failed to run diagnostic",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isGood: boolean, isWarning?: boolean) => {
    if (isGood) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (isWarning) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const formatLogLevel = (level: string) => {
    const colors = {
      error: 'text-red-600',
      warn: 'text-yellow-600',
      info: 'text-blue-600',
      debug: 'text-gray-600'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Registration Diagnostic Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user UUID"
            />
          </div>

          <Button 
            onClick={runDiagnostic} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Run Diagnostic
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Critical Issues Alert */}
          {(result.analysis.stuck_in_payment_pending || result.analysis.has_failed_tasks || result.analysis.task_processing_issues) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical Issues Detected:</strong>
                <ul className="list-disc ml-4 mt-2">
                  {result.analysis.stuck_in_payment_pending && <li>User stuck in payment pending status</li>}
                  {result.analysis.has_failed_tasks && <li>Failed registration tasks detected</li>}
                  {result.analysis.task_processing_issues && <li>Tasks with high retry counts (processing issues)</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Status */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Profile Exists:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.profile.exists)}
                  <span>{result.profile.exists ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Registration Status:</span>
                <span className="font-medium">{result.profile.registration_status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Name:</span>
                <span>{result.profile.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phone:</span>
                <span>{result.profile.phone || 'Not set'}</span>
              </div>
              {result.profile.registration_completed_at && (
                <div className="flex items-center justify-between">
                  <span>Registration Completed:</span>
                  <span className="text-sm">{new Date(result.profile.registration_completed_at).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Tasks ({result.tasks.total_count})</CardTitle>
            </CardHeader>
            <CardContent>
              {result.tasks.total_count === 0 ? (
                <p className="text-gray-500">No registration tasks found</p>
              ) : (
                <div className="space-y-2">
                  {result.tasks.tasks.map((task: TaskData, index: number) => (
                    <div key={task.id || index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{task.task_type}</span>
                        {task.retry_count > 0 && <span className="text-sm text-gray-500"> (retries: {task.retry_count})</span>}
                        {task.error_details && (
                          <div className="text-xs text-red-600 mt-1">
                            Error: {typeof task.error_details === 'string' ? task.error_details : JSON.stringify(task.error_details)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(
                          task.status === 'completed',
                          task.status === 'pending' || task.status === 'in_progress'
                        )}
                        <span className={`text-sm ${
                          task.status === 'completed' ? 'text-green-600' :
                          task.status === 'failed' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Care Team Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Care Team Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Assignment Exists:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.care_team_assignment.exists)}
                  <span>{result.care_team_assignment.exists ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Doctor Assigned:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.care_team_assignment.doctor_assigned)}
                  <span>{result.care_team_assignment.doctor_assigned ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Nutritionist Assigned:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.care_team_assignment.nutritionist_assigned)}
                  <span>{result.care_team_assignment.nutritionist_assigned ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Room */}
          <Card>
            <CardHeader>
              <CardTitle>Chat Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Chat Room Exists:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.chat_room.exists)}
                  <span>{result.chat_room.exists ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {result.chat_room.exists && (
                <>
                  <div className="flex items-center justify-between">
                    <span>Room Name:</span>
                    <span>{result.chat_room.room_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Member Count:</span>
                    <span>{result.chat_room.member_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active:</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.chat_room.is_active)}
                      <span>{result.chat_room.is_active ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* System Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>System Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Registration Flow Complete:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.analysis.registration_flow_complete)}
                  <span>{result.analysis.registration_flow_complete ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Has Pending Tasks:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(!result.analysis.has_pending_tasks, result.analysis.has_pending_tasks)}
                  <span>{result.analysis.has_pending_tasks ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Has Failed Tasks:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(!result.analysis.has_failed_tasks)}
                  <span>{result.analysis.has_failed_tasks ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Logs */}
          {systemLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent System Logs ({systemLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {systemLogs.map((log, index) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.action}</span>
                        <span className={`text-xs ${formatLogLevel(log.level)}`}>
                          {log.level?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-gray-600 mt-1">{log.message}</div>
                      {log.details && (
                        <div className="text-xs text-gray-500 mt-1 bg-gray-50 p-1 rounded">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Data */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Diagnostic Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task Summary */}
      {taskSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Task Processing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {taskSummary.map((summary, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span>{summary.task_type} ({summary.status})</span>
                  <div className="text-sm text-gray-600">
                    Count: {summary.count}, Avg Retries: {parseFloat(summary.avg_retry_count).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
