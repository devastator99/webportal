
export const generatePasswordResetTestEmails = () => [
  'test.password.reset.patient@example.com',
  'test.password.reset.doctor@example.com',
  'test.password.reset.admin@example.com',
  'test.password.reset.nutritionist@example.com',
  'test.edge.case.user@example.com',
  'test.special.chars+user@example.com',
  'test.long.email.address.user@example.com',
  'test.invalid.domain@nonexistent.test'
];

export const generateTestPhoneNumbers = () => [
  '+91-9999-111-001',
  '+91-9999-111-002', 
  '+91-9999-111-003',
  '+91-9999-111-004',
  '+91-9999-111-005',
  '+91-9999-111-006',
  '+91-9999-111-007',
  '+91-0000-000-000'
];

export const generateRegistrationTestEmails = () => [
  'test.new.patient.registration@example.com',
  'test.new.doctor.registration@example.com',
  'test.new.nutritionist.registration@example.com',
  'test.incomplete.registration@example.com',
  'test.duplicate.email@example.com'
];

export const generatePaymentTestData = () => ({
  razorpay: {
    test_key_id: 'rzp_test_healthcare_123456',
    test_key_secret: 'test_secret_healthcare_key',
    webhook_secret: 'test_webhook_secret_123',
    test_order_ids: [
      'order_test_success_001',
      'order_test_failure_002',
      'order_test_pending_003',
      'order_test_timeout_004',
      'order_test_refund_005'
    ],
    test_payment_scenarios: [
      {
        scenario: 'successful_payment',
        payment_id: 'pay_test_success_001',
        order_id: 'order_test_success_001',
        amount: 50000,
        status: 'captured',
        method: 'card',
        description: 'Registration fee payment - Success scenario'
      },
      {
        scenario: 'payment_failure',
        payment_id: 'pay_test_failure_002',
        order_id: 'order_test_failure_002',
        amount: 50000,
        status: 'failed',
        error_code: 'BAD_REQUEST_ERROR',
        error_description: 'Payment declined by bank',
        description: 'Registration fee payment - Failure scenario'
      }
    ]
  }
});

export const generateEmailTestingData = () => ({
  resendConfiguration: {
    fromEmail: 'onboarding@resend.dev',
    fromName: 'Healthcare App Testing',
    testDomain: 'resend.dev'
  },
  emailTemplates: {
    passwordReset: {
      subject: 'Password Reset Code - Healthcare App',
      expectedOtpLength: 6,
      expiryMinutes: 10,
      retryAttempts: 3
    },
    registrationConfirmation: {
      subject: 'Welcome to Healthcare App',
      expectedContent: ['welcome', 'account created', 'next steps']
    }
  }
});
