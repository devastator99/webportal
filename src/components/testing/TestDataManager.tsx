
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Mail, Phone, CreditCard, TestTube, Copy, CheckCircle } from 'lucide-react';

interface TestData {
  users: Array<{
    id: string;
    email: string;
    phone: string;
    role: string;
    purpose: string;
  }>;
  testCredentials: {
    passwordReset?: {
      emails: string[];
      phones: string[];
      testPasswords: string[];
      flows: string[];
    };
    emailTesting?: {
      validEmails: string[];
      invalidEmail: string;
      expectedSubject: string;
      expectedSender: string;
    };
    smsTesting?: {
      validPhones: string[];
      invalidPhone: string;
      expectedFormat: string;
    };
    registration?: Array<{
      email: string;
      phone: string;
      role: string;
      firstName: string;
      lastName: string;
    }>;
  };
  passwordResetScenarios: Array<{
    email: string;
    phone: string;
    role: string;
    testPassword: string;
    expectedFlow: string;
    description: string;
  }>;
  paymentTestData: {
    razorpay?: {
      test_key_id: string;
      test_key_secret: string;
      test_order_ids: string[];
      test_payment_scenarios: Array<{
        scenario: string;
        payment_id: string;
        order_id: string;
        amount: number;
        status: string;
        error_code?: string;
      }>;
    };
  };
}

export const TestDataManager = () => {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const createTestData = async (type: 'full' | 'password_reset' | 'registration' | 'payment') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-comprehensive-test-data', {
        body: { type, count: 5 }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      setTestData(data.data);
      toast.success(`Test data created successfully for ${type}`);
    } catch (error: any) {
      console.error('Test data creation error:', error);
      toast.error(`Failed to create test data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, label)}
      className="h-6 w-6 p-0"
    >
      {copiedItem === label ? (
        <CheckCircle className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Data Manager
          </CardTitle>
          <CardDescription>
            Generate and manage test data for registration, password reset, and payment flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => createTestData('password_reset')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Password Reset
            </Button>
            <Button
              onClick={() => createTestData('registration')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Registration
            </Button>
            <Button
              onClick={() => createTestData('payment')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Payment
            </Button>
            <Button
              onClick={() => createTestData('full')}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              All Test Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {testData && (
        <Tabs defaultValue="password-reset" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="password-reset">Password Reset</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="users">Test Users</TabsTrigger>
          </TabsList>

          <TabsContent value="password-reset" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Password Reset Testing
                </CardTitle>
                <CardDescription>
                  Test credentials and scenarios for password reset flows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    These test emails will receive actual password reset emails when testing. 
                    The emails are sent via Resend service to verify the complete flow.
                  </AlertDescription>
                </Alert>

                {testData.testCredentials.passwordReset && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Test Email Addresses</h4>
                      <div className="grid gap-2">
                        {testData.testCredentials.passwordReset.emails.map((email, index) => (
                          <div key={email} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm">{email}</span>
                            <CopyButton text={email} label={`Email ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Test Phone Numbers</h4>
                      <div className="grid gap-2">
                        {testData.testCredentials.passwordReset.phones.map((phone, index) => (
                          <div key={phone} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm">{phone}</span>
                            <CopyButton text={phone} label={`Phone ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Test Scenarios</h4>
                      <div className="grid gap-3">
                        {testData.passwordResetScenarios.map((scenario, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{scenario.role}</Badge>
                                  <Badge variant="secondary">{scenario.expectedFlow}</Badge>
                                </div>
                                <p className="text-sm text-gray-600">{scenario.description}</p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Email:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono">{scenario.email}</span>
                                      <CopyButton text={scenario.email} label={`Scenario ${index + 1} Email`} />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Test Password:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono">{scenario.testPassword}</span>
                                      <CopyButton text={scenario.testPassword} label={`Scenario ${index + 1} Password`} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Registration Testing
                </CardTitle>
                <CardDescription>
                  Test data for new user registration flows
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testData.testCredentials.registration && (
                  <div className="grid gap-4">
                    {testData.testCredentials.registration.map((user, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Name:</span>
                              <p>{user.firstName} {user.lastName}</p>
                            </div>
                            <div>
                              <span className="font-medium">Role:</span>
                              <Badge variant="outline">{user.role}</Badge>
                            </div>
                            <div>
                              <span className="font-medium">Email:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{user.email}</span>
                                <CopyButton text={user.email} label={`Registration ${index + 1} Email`} />
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{user.phone}</span>
                                <CopyButton text={user.phone} label={`Registration ${index + 1} Phone`} />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Testing
                </CardTitle>
                <CardDescription>
                  Test payment scenarios and mock data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testData.paymentTestData.razorpay && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Test API Keys</h4>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-mono text-sm">{testData.paymentTestData.razorpay.test_key_id}</span>
                          <CopyButton text={testData.paymentTestData.razorpay.test_key_id} label="Test Key ID" />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Payment Scenarios</h4>
                      <div className="grid gap-3">
                        {testData.paymentTestData.razorpay.test_payment_scenarios.map((scenario, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={scenario.scenario === 'success' ? 'default' : scenario.scenario === 'failure' ? 'destructive' : 'secondary'}>
                                    {scenario.scenario}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Payment ID:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono">{scenario.payment_id}</span>
                                      <CopyButton text={scenario.payment_id} label={`Payment ID ${index + 1}`} />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Amount:</span>
                                    <p>₹{scenario.amount / 100}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Created Test Users
                </CardTitle>
                <CardDescription>
                  Users created for testing various flows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {testData.users.map((user, index) => (
                    <Card key={user.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{user.role}</Badge>
                            <Badge variant="secondary">{user.purpose}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Email:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{user.email}</span>
                                <CopyButton text={user.email} label={`User ${index + 1} Email`} />
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{user.phone}</span>
                                <CopyButton text={user.phone} label={`User ${index + 1} Phone`} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
