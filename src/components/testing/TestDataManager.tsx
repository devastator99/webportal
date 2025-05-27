import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Mail, Phone, CreditCard, TestTube, Copy, CheckCircle, AlertTriangle, Clock, Zap } from 'lucide-react';

interface TestData {
  users: Array<{
    id: string;
    email: string;
    phone: string;
    role: string;
    purpose: string;
    initialPassword?: string;
  }>;
  testCredentials: {
    passwordReset?: {
      validEmails: string[];
      invalidEmails: string[];
      validPhones: string[];
      invalidPhones: string[];
      testPasswords: string[];
      expectedFlows: string[];
    };
    registration?: {
      newUserEmails: string[];
      newUserPhones: string[];
      roles: string[];
      requiredFields: Record<string, string[]>;
    };
    authentication?: {
      loginCredentials: Array<{
        email: string;
        password: string;
        role: string;
      }>;
    };
  };
  passwordResetScenarios: Array<{
    email: string;
    phone: string;
    role: string;
    testPassword: string;
    expectedFlow: string;
    description: string;
    testSteps: string[];
  }>;
  registrationScenarios: Array<{
    email: string;
    phone: string;
    role: string;
    firstName: string;
    lastName: string;
    scenario: string;
    description: string;
    medicalInfo?: any;
    professionalInfo?: any;
  }>;
  paymentTestData: {
    razorpay?: {
      test_key_id: string;
      test_key_secret: string;
      webhook_secret: string;
      test_order_ids: string[];
      test_payment_scenarios: Array<{
        scenario: string;
        payment_id: string;
        order_id: string;
        amount: number;
        status: string;
        method?: string;
        error_code?: string;
        error_description?: string;
        description: string;
      }>;
    };
    mockPaymentFlow?: {
      successRate: number;
      averageProcessingTime: number;
      testCards: Array<{
        number: string;
        type: string;
        result: string;
      }>;
    };
  };
  emailTestingData: {
    resendConfiguration?: {
      fromEmail: string;
      fromName: string;
      testDomain: string;
    };
    emailTemplates?: {
      passwordReset: {
        subject: string;
        expectedOtpLength: number;
        expiryMinutes: number;
        retryAttempts: number;
      };
      registrationConfirmation: {
        subject: string;
        expectedContent: string[];
      };
      paymentConfirmation: {
        subject: string;
        expectedContent: string[];
      };
    };
    testScenarios?: Array<{
      scenario: string;
      testEmail?: string;
      testEmails?: string[];
      expectedDeliveryTime?: string;
      description?: string;
      steps?: string[];
    }>;
  };
  stepByStepGuide: {
    passwordResetTesting?: {
      phase: string;
      steps: Array<{
        step: number;
        title: string;
        actions: string[];
        expectedResult?: string;
      }>;
    };
    registrationTesting?: {
      phase: string;
      steps: Array<{
        step: number;
        title: string;
        actions: string[];
        expectedResult?: string;
      }>;
    };
    paymentTesting?: {
      phase: string;
      testScenarios: string[];
    };
  };
}

export const TestDataManager = () => {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [testProgress, setTestProgress] = useState<Record<string, boolean>>({});

  const createTestData = async (type: 'full' | 'password_reset' | 'registration' | 'payment' | 'email_testing') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-comprehensive-test-data', {
        body: { type, count: 10 }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      setTestData(data.data);
      toast.success(`Comprehensive test data created for ${type}`, {
        description: `${data.summary.usersCreated} users, ${data.summary.passwordResetScenarios} scenarios created`
      });
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

  const markStepComplete = (stepId: string) => {
    setTestProgress(prev => ({ ...prev, [stepId]: true }));
    toast.success('Step marked as complete');
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

  const StepCard = ({ step, phase }: { step: any; phase: string }) => {
    const stepId = `${phase}-step-${step.step}`;
    const isComplete = testProgress[stepId];
    
    return (
      <Card className={`transition-all ${isComplete ? 'border-green-500 bg-green-50' : ''}`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {isComplete ? <CheckCircle className="h-3 w-3" /> : step.step}
              </div>
              <h4 className="font-medium">{step.title}</h4>
            </div>
            <Button
              variant={isComplete ? "default" : "outline"}
              size="sm"
              onClick={() => markStepComplete(stepId)}
              disabled={isComplete}
            >
              {isComplete ? <CheckCircle className="h-3 w-3" /> : 'Mark Complete'}
            </Button>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Actions:</span>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {step.actions.map((action: string, index: number) => (
                  <li key={index} className="text-sm text-gray-700">{action}</li>
                ))}
              </ul>
            </div>
            
            {step.expectedResult && (
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                <span className="text-sm font-medium text-blue-800">Expected Result:</span>
                <p className="text-sm text-blue-700">{step.expectedResult}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Comprehensive Test Data Manager
          </CardTitle>
          <CardDescription>
            Generate and manage test data for all flows: registration, password reset, payments, and email testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              onClick={() => createTestData('email_testing')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Email Testing
            </Button>
            <Button
              onClick={() => createTestData('full')}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Complete System
            </Button>
          </div>
          
          {loading && (
            <div className="mt-4">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">Creating comprehensive test data...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {testData && (
        <Tabs defaultValue="step-by-step" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="step-by-step">Testing Guide</TabsTrigger>
            <TabsTrigger value="password-reset">Password Reset</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="email-testing">Email Testing</TabsTrigger>
            <TabsTrigger value="users">Test Users</TabsTrigger>
          </TabsList>

          <TabsContent value="step-by-step" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Step-by-Step Testing Guide
                </CardTitle>
                <CardDescription>
                  Follow these comprehensive steps to test all application flows
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testData.stepByStepGuide.passwordResetTesting && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {testData.stepByStepGuide.passwordResetTesting.phase}
                    </h3>
                    <div className="grid gap-4">
                      {testData.stepByStepGuide.passwordResetTesting.steps.map((step, index) => (
                        <StepCard key={index} step={step} phase="password-reset" />
                      ))}
                    </div>
                  </div>
                )}

                {testData.stepByStepGuide.registrationTesting && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {testData.stepByStepGuide.registrationTesting.phase}
                    </h3>
                    <div className="grid gap-4">
                      {testData.stepByStepGuide.registrationTesting.steps.map((step, index) => (
                        <StepCard key={index} step={step} phase="registration" />
                      ))}
                    </div>
                  </div>
                )}

                {testData.stepByStepGuide.paymentTesting && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {testData.stepByStepGuide.paymentTesting.phase}
                    </h3>
                    <div className="grid gap-2">
                      {testData.stepByStepGuide.paymentTesting.testScenarios.map((scenario, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="text-sm">{scenario}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password-reset" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Password Reset Testing
                </CardTitle>
                <CardDescription>
                  Comprehensive test data for password reset flow with real email sending
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These test emails will receive actual password reset emails via Resend service. 
                    Check your email inbox during testing.
                  </AlertDescription>
                </Alert>

                {testData.testCredentials.passwordReset && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Valid Test Email Addresses</h4>
                      <div className="grid gap-2">
                        {testData.testCredentials.passwordReset.validEmails.map((email, index) => (
                          <div key={email} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                            <span className="font-mono text-sm">{email}</span>
                            <CopyButton text={email} label={`Valid Email ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Invalid Test Email Addresses (Edge Cases)</h4>
                      <div className="grid gap-2">
                        {testData.testCredentials.passwordReset.invalidEmails.map((email, index) => (
                          <div key={email} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                            <span className="font-mono text-sm">{email}</span>
                            <CopyButton text={email} label={`Invalid Email ${index + 1}`} />
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
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{scenario.role}</Badge>
                                  <Badge variant="secondary">{scenario.expectedFlow}</Badge>
                                </div>
                                <p className="text-sm text-gray-600">{scenario.description}</p>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Test Email:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono">{scenario.email}</span>
                                      <CopyButton text={scenario.email} label={`Scenario ${index + 1} Email`} />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">New Password:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono">{scenario.testPassword}</span>
                                      <CopyButton text={scenario.testPassword} label={`Scenario ${index + 1} Password`} />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <span className="font-medium text-sm">Test Steps:</span>
                                  <ol className="list-decimal list-inside mt-1 space-y-1">
                                    {scenario.testSteps.map((step, stepIndex) => (
                                      <li key={stepIndex} className="text-sm text-gray-600">{step}</li>
                                    ))}
                                  </ol>
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

          <TabsContent value="email-testing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Email Testing Configuration
                </CardTitle>
                <CardDescription>
                  Email service testing with Resend integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testData.emailTestingData.resendConfiguration && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Resend Configuration</h4>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm"><strong>From Email:</strong> {testData.emailTestingData.resendConfiguration.fromEmail}</span>
                          <CopyButton text={testData.emailTestingData.resendConfiguration.fromEmail} label="From Email" />
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm"><strong>From Name:</strong> {testData.emailTestingData.resendConfiguration.fromName}</span>
                          <CopyButton text={testData.emailTestingData.resendConfiguration.fromName} label="From Name" />
                        </div>
                      </div>
                    </div>

                    {testData.emailTestingData.emailTemplates && (
                      <div>
                        <h4 className="font-medium mb-2">Email Templates Testing</h4>
                        <div className="grid gap-3">
                          <Card>
                            <CardContent className="pt-4">
                              <h5 className="font-medium">Password Reset Email</h5>
                              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                <div><strong>Subject:</strong> {testData.emailTestingData.emailTemplates.passwordReset.subject}</div>
                                <div><strong>OTP Length:</strong> {testData.emailTestingData.emailTemplates.passwordReset.expectedOtpLength} digits</div>
                                <div><strong>Expires:</strong> {testData.emailTestingData.emailTemplates.passwordReset.expiryMinutes} minutes</div>
                                <div><strong>Retry Attempts:</strong> {testData.emailTestingData.emailTemplates.passwordReset.retryAttempts}</div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {testData.emailTestingData.testScenarios && (
                      <div>
                        <h4 className="font-medium mb-2">Email Test Scenarios</h4>
                        <div className="grid gap-3">
                          {testData.emailTestingData.testScenarios.map((scenario, index) => (
                            <Card key={index}>
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{scenario.scenario}</Badge>
                                  {scenario.expectedDeliveryTime && (
                                    <Badge variant="secondary">{scenario.expectedDeliveryTime}</Badge>
                                  )}
                                </div>
                                {scenario.description && (
                                  <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                                )}
                                {scenario.testEmail && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Test Email:</span>
                                    <span className="font-mono text-sm">{scenario.testEmail}</span>
                                    <CopyButton text={scenario.testEmail} label={`${scenario.scenario} email`} />
                                  </div>
                                )}
                                {scenario.steps && (
                                  <div className="mt-2">
                                    <span className="text-sm font-medium">Steps:</span>
                                    <ol className="list-decimal list-inside mt-1 space-y-1">
                                      {scenario.steps.map((step, stepIndex) => (
                                        <li key={stepIndex} className="text-sm text-gray-600">{step}</li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
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
                    {testData.registrationScenarios.map((user, index) => (
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
                                  <Badge variant={scenario.scenario === 'successful_payment' ? 'default' : scenario.scenario === 'payment_failure' ? 'destructive' : 'secondary'}>
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
