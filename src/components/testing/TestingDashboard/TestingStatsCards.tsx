
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, CreditCard, Zap } from 'lucide-react';

export const TestingStatsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Password Reset Flow</CardTitle>
          <Mail className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Tests complete email OTP sending, verification, and password update flows with real email delivery
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">Real Email OTP</Badge>
              <Badge variant="outline" className="text-xs">Resend API</Badge>
              <Badge variant="outline" className="text-xs">Multi-Role</Badge>
              <Badge variant="outline" className="text-xs">Edge Cases</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Registration Testing</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Tests complete user registration flow including patient payment, care team assignment, and profile setup
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">Multi-Role</Badge>
              <Badge variant="outline" className="text-xs">Payment Flow</Badge>
              <Badge variant="outline" className="text-xs">Profile Setup</Badge>
              <Badge variant="outline" className="text-xs">Care Team</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Flow Testing</CardTitle>
          <CreditCard className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Tests payment integration with Razorpay including success, failure, timeout, and pending scenarios
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">Razorpay</Badge>
              <Badge variant="outline" className="text-xs">Mock Payments</Badge>
              <Badge variant="outline" className="text-xs">Multiple Scenarios</Badge>
              <Badge variant="outline" className="text-xs">Webhooks</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Email Service Testing</CardTitle>
          <Zap className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Tests email delivery, templates, OTP generation, and email service integration with Resend
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">Resend Integration</Badge>
              <Badge variant="outline" className="text-xs">Template Testing</Badge>
              <Badge variant="outline" className="text-xs">Delivery Tracking</Badge>
              <Badge variant="outline" className="text-xs">OTP Validation</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
