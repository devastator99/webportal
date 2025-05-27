
import { TestDataManager } from '@/components/testing/TestDataManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TestTube, Mail, Phone, CreditCard, Users, CheckCircle } from 'lucide-react';

export const TestingPage = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TestTube className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Testing Dashboard</h1>
            <p className="text-gray-600">Comprehensive test data generation and management</p>
          </div>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            This testing dashboard generates real test data that integrates with all app features including 
            email sending, SMS, payment processing, and user registration flows.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Password Reset</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Tests email OTP sending, verification, and password update flows
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Email OTP</Badge>
                <Badge variant="outline" className="text-xs">Resend API</Badge>
                <Badge variant="outline" className="text-xs">Auth Flow</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Testing</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Tests SMS OTP sending and phone number verification
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">SMS OTP</Badge>
                <Badge variant="outline" className="text-xs">Twilio</Badge>
                <Badge variant="outline" className="text-xs">Phone Auth</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Flow</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Tests payment integration with various success/failure scenarios
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Razorpay</Badge>
                <Badge variant="outline" className="text-xs">Mock Payments</Badge>
                <Badge variant="outline" className="text-xs">Scenarios</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Tests complete user registration flow for all roles
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Multi-Role</Badge>
                <Badge variant="outline" className="text-xs">Profile Setup</Badge>
                <Badge variant="outline" className="text-xs">Validation</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TestDataManager />

      <Card>
        <CardHeader>
          <CardTitle>Testing Guide</CardTitle>
          <CardDescription>Step-by-step instructions for testing each flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Password Reset Email Testing
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-6">
              <li>Click "Password Reset" button above to generate test users</li>
              <li>Copy one of the test email addresses from the Password Reset tab</li>
              <li>Go to the login page and click "Forgot Password"</li>
              <li>Enter the test email address and submit</li>
              <li>Check your email inbox for the password reset OTP</li>
              <li>Enter the 6-digit OTP and set a new password</li>
              <li>Verify you can login with the new password</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              SMS OTP Testing
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-6">
              <li>Copy a test phone number from the generated data</li>
              <li>Try the SMS password reset flow</li>
              <li>Note: SMS will not actually be sent to test numbers</li>
              <li>Use the mock OTP code provided in the test data</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Testing
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-6">
              <li>Use the test Razorpay key ID from Payment tab</li>
              <li>Test different payment scenarios (success, failure, pending)</li>
              <li>Use the provided test payment IDs and order IDs</li>
              <li>Verify payment status updates correctly in the app</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Registration Testing
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-6">
              <li>Use test email/phone combinations from Registration tab</li>
              <li>Test registration for different user roles</li>
              <li>Verify profile creation and role assignment</li>
              <li>Test incomplete registration scenarios</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestingPage;
