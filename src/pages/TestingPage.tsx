
import { TestDataManager } from '@/components/testing/TestDataManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TestTube, Mail, Phone, CreditCard, Users, CheckCircle, Clock, Zap, AlertTriangle } from 'lucide-react';

export const TestingPage = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TestTube className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Comprehensive Testing Dashboard</h1>
            <p className="text-gray-600">Complete test data generation and step-by-step testing guide for all application flows</p>
          </div>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            This comprehensive testing system generates real test data that integrates with all app features including 
            email sending (via Resend), SMS, payment processing (Razorpay), and complete user registration flows.
            Follow the step-by-step guide for systematic testing.
          </AlertDescription>
        </Alert>
      </div>

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

      <TestDataManager />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Complete Testing Guide
          </CardTitle>
          <CardDescription>Comprehensive step-by-step instructions for testing each flow systematically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This testing system creates real data and sends actual emails. 
              Use the provided test email addresses to avoid affecting real users.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                Password Reset Email Testing (Complete Flow)
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li><strong>Generate Test Data:</strong> Click "Password Reset" or "Complete System" button above</li>
                  <li><strong>Copy Test Email:</strong> Use provided test email addresses (e.g., test.password.reset.patient@example.com)</li>
                  <li><strong>Navigate to App:</strong> Go to login page → Click "Forgot Password"</li>
                  <li><strong>Initiate Reset:</strong> Enter test email address and submit</li>
                  <li><strong>Check Email Inbox:</strong> Look for email from "onboarding@resend.dev" (should arrive within 30 seconds)</li>
                  <li><strong>Verify OTP:</strong> Enter the 6-digit OTP from email</li>
                  <li><strong>Set New Password:</strong> Create new password (min 8 chars, 1 uppercase, 1 number)</li>
                  <li><strong>Test Login:</strong> Login with email and new password to verify success</li>
                </ol>
                <div className="mt-3 p-2 bg-blue-100 rounded">
                  <strong>Expected Result:</strong> Complete password reset flow with real email delivery and successful login
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                Registration Flow Testing (End-to-End)
              </h3>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li><strong>Generate Test Data:</strong> Click "Registration" or "Complete System" button above</li>
                  <li><strong>Start Registration:</strong> Navigate to /register and select "Patient"</li>
                  <li><strong>Fill Details:</strong> Use test email (e.g., test.complete.patient.reg@example.com) and test phone</li>
                  <li><strong>Complete Profile:</strong> Fill medical information using provided test data</li>
                  <li><strong>Payment Step:</strong> Use test payment credentials or mock payment flow</li>
                  <li><strong>Verify Registration:</strong> Check that care team is assigned and registration is complete</li>
                  <li><strong>Test Login:</strong> Login with registered credentials</li>
                </ol>
                <div className="mt-3 p-2 bg-green-100 rounded">
                  <strong>Expected Result:</strong> Complete patient registration with payment processing and care team assignment
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                Payment Flow Testing (Multiple Scenarios)
              </h3>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li><strong>Generate Payment Data:</strong> Click "Payment" or "Complete System" button above</li>
                  <li><strong>Test Success Scenario:</strong> Use test order ID "order_test_success_001"</li>
                  <li><strong>Test Failure Scenario:</strong> Use test order ID "order_test_failure_002"</li>
                  <li><strong>Test Pending Scenario:</strong> Use test order ID "order_test_pending_003"</li>
                  <li><strong>Test Timeout Scenario:</strong> Use test order ID "order_test_timeout_004"</li>
                  <li><strong>Verify Status Updates:</strong> Check that payment status updates correctly in the app</li>
                </ol>
                <div className="mt-3 p-2 bg-purple-100 rounded">
                  <strong>Expected Result:</strong> Different payment outcomes handled correctly with appropriate user feedback
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                Email Service Testing (Resend Integration)
              </h3>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li><strong>Generate Email Test Data:</strong> Click "Email Testing" or "Complete System" button above</li>
                  <li><strong>Test Bulk Emails:</strong> Trigger multiple password resets simultaneously</li>
                  <li><strong>Verify Delivery Time:</strong> Check that emails arrive within expected timeframe (&lt; 30 seconds)</li>
                  <li><strong>Test Email Content:</strong> Verify OTP format, subject line, and sender information</li>
                  <li><strong>Test Edge Cases:</strong> Try invalid email addresses and verify error handling</li>
                  <li><strong>Monitor Email Logs:</strong> Check Resend dashboard for delivery confirmations</li>
                </ol>
                <div className="mt-3 p-2 bg-orange-100 rounded">
                  <strong>Expected Result:</strong> Reliable email delivery with proper formatting and error handling
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Testing Checklist
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium">Pre-Testing Setup:</h5>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Ensure Resend API key is configured</li>
                  <li>Verify Razorpay test credentials</li>
                  <li>Clear browser cache/cookies</li>
                  <li>Have email access ready</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium">Post-Testing Verification:</h5>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Check database for created users</li>
                  <li>Verify email delivery logs</li>
                  <li>Confirm payment status updates</li>
                  <li>Test cleanup if needed</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestingPage;
