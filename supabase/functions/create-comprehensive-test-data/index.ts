
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTestDataRequest {
  type: 'full' | 'password_reset' | 'registration' | 'payment' | 'email_testing';
  count?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type = 'full', count = 10 }: CreateTestDataRequest = await req.json()
    
    console.log(`[Test Data] Creating comprehensive test data of type: ${type}`)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const testData = {
      users: [],
      testCredentials: {},
      passwordResetScenarios: [],
      registrationScenarios: [],
      paymentTestData: {},
      emailTestingData: {},
      stepByStepGuide: {}
    }

    // Comprehensive test email addresses for different scenarios
    const passwordResetTestEmails = [
      'test.password.reset.patient@example.com',
      'test.password.reset.doctor@example.com',
      'test.password.reset.admin@example.com',
      'test.password.reset.nutritionist@example.com',
      'test.edge.case.user@example.com',
      'test.special.chars+user@example.com',
      'test.long.email.address.user@example.com',
      'test.invalid.domain@nonexistent.test'
    ]

    // Test phone numbers with Indian format (non-functional but valid format)
    const testPhoneNumbers = [
      '+91-9999-111-001',
      '+91-9999-111-002', 
      '+91-9999-111-003',
      '+91-9999-111-004',
      '+91-9999-111-005',
      '+91-9999-111-006',
      '+91-9999-111-007',
      '+91-0000-000-000' // Invalid for edge case testing
    ]

    // Registration test emails (separate from password reset)
    const registrationTestEmails = [
      'test.new.patient.registration@example.com',
      'test.new.doctor.registration@example.com',
      'test.new.nutritionist.registration@example.com',
      'test.incomplete.registration@example.com',
      'test.duplicate.email@example.com'
    ]

    if (type === 'password_reset' || type === 'full' || type === 'email_testing') {
      console.log('[Test Data] Creating password reset and email testing users...')
      
      const userRoles = ['patient', 'doctor', 'nutritionist', 'administrator']
      
      for (let i = 0; i < Math.min(count, passwordResetTestEmails.length); i++) {
        const email = passwordResetTestEmails[i]
        const phone = testPhoneNumbers[i]
        const role = userRoles[i % userRoles.length]
        
        try {
          // Create test user in auth
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: {
              test_user: true,
              purpose: 'password_reset_and_email_testing',
              created_for_testing: new Date().toISOString()
            }
          })

          if (authError) {
            if (authError.message.includes('already exists')) {
              console.log(`[Test Data] User already exists: ${email}`)
              continue
            } else {
              console.log(`[Test Data] Auth error for ${email}:`, authError.message)
              continue
            }
          }

          if (authUser.user) {
            // Create profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: authUser.user.id,
                first_name: `Test${role.charAt(0).toUpperCase() + role.slice(1)}`,
                last_name: `User${i + 1}`,
                email: email,
                phone_number: phone,
                emergency_contact: phone,
                specialty: role === 'doctor' ? 'General Medicine' : null,
                updated_at: new Date().toISOString()
              })

            if (profileError) {
              console.log(`[Test Data] Profile error for ${email}:`, profileError.message)
            }

            // Assign role
            const { error: roleError } = await supabase
              .from('user_roles')
              .upsert({
                user_id: authUser.user.id,
                role: role
              })

            if (roleError) {
              console.log(`[Test Data] Role error for ${email}:`, roleError.message)
            }

            testData.users.push({
              id: authUser.user.id,
              email,
              phone,
              role,
              purpose: 'password_reset_and_email_testing',
              initialPassword: 'TestPassword123!'
            })

            // Create password reset test scenarios
            testData.passwordResetScenarios.push({
              email,
              phone,
              role,
              testPassword: 'NewTestPassword123!',
              expectedFlow: 'email_otp',
              description: `Test password reset for ${role} user via email`,
              testSteps: [
                'Go to login page',
                'Click "Forgot Password"',
                `Enter email: ${email}`,
                'Check email for OTP',
                'Enter 6-digit OTP',
                'Set new password',
                'Login with new password'
              ]
            })
          }
        } catch (error) {
          console.log(`[Test Data] Error creating user ${email}:`, error.message)
        }
      }
    }

    if (type === 'registration' || type === 'full') {
      console.log('[Test Data] Creating registration test scenarios...')
      
      const registrationScenarios = [
        {
          email: 'test.complete.patient.reg@example.com',
          phone: '+91-9999-201-001',
          role: 'patient',
          firstName: 'TestPatient',
          lastName: 'CompleteReg',
          scenario: 'complete_registration',
          description: 'Complete patient registration with payment',
          medicalInfo: {
            age: 25,
            weight: 70,
            height: 170,
            bloodGroup: 'O+',
            medicalHistory: 'No significant medical history'
          }
        },
        {
          email: 'test.complete.doctor.reg@example.com',
          phone: '+91-9999-201-002',
          role: 'doctor',
          firstName: 'TestDoctor',
          lastName: 'CompleteReg',
          scenario: 'doctor_registration',
          description: 'Complete doctor registration',
          professionalInfo: {
            specialty: 'Cardiology',
            experience: '5 years',
            qualification: 'MBBS, MD',
            registrationNumber: 'TEST-DOC-001'
          }
        },
        {
          email: 'test.incomplete.reg@example.com',
          phone: '+91-9999-201-003',
          role: 'patient',
          firstName: 'TestIncomplete',
          lastName: 'RegUser',
          scenario: 'incomplete_registration',
          description: 'Test incomplete registration scenario'
        }
      ]

      testData.registrationScenarios = registrationScenarios
    }

    if (type === 'payment' || type === 'full') {
      console.log('[Test Data] Creating comprehensive payment test data...')
      
      testData.paymentTestData = {
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
              amount: 50000, // ₹500
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
            },
            {
              scenario: 'payment_pending',
              payment_id: 'pay_test_pending_003',
              order_id: 'order_test_pending_003',
              amount: 50000,
              status: 'created',
              description: 'Registration fee payment - Pending scenario'
            },
            {
              scenario: 'payment_timeout',
              payment_id: 'pay_test_timeout_004',
              order_id: 'order_test_timeout_004',
              amount: 50000,
              status: 'failed',
              error_code: 'GATEWAY_ERROR',
              error_description: 'Payment gateway timeout',
              description: 'Registration fee payment - Timeout scenario'
            }
          ]
        },
        mockPaymentFlow: {
          successRate: 0.8, // 80% success rate for mock payments
          averageProcessingTime: 3000, // 3 seconds
          testCards: [
            {
              number: '4111111111111111',
              type: 'Visa',
              result: 'success'
            },
            {
              number: '4000000000000002',
              type: 'Visa',
              result: 'decline'
            },
            {
              number: '4000000000000119',
              type: 'Visa',
              result: 'processing_error'
            }
          ]
        }
      }
    }

    if (type === 'email_testing' || type === 'full') {
      console.log('[Test Data] Creating email testing configuration...')
      
      testData.emailTestingData = {
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
          },
          paymentConfirmation: {
            subject: 'Payment Confirmation - Healthcare App',
            expectedContent: ['payment successful', 'amount', 'receipt']
          }
        },
        testScenarios: [
          {
            scenario: 'password_reset_email',
            testEmail: passwordResetTestEmails[0],
            expectedDeliveryTime: '< 30 seconds',
            steps: [
              'Trigger password reset',
              'Check email delivery',
              'Verify OTP format',
              'Test OTP validation',
              'Confirm password update'
            ]
          },
          {
            scenario: 'bulk_email_testing',
            testEmails: passwordResetTestEmails.slice(0, 5),
            description: 'Test multiple email deliveries simultaneously'
          }
        ]
      }
    }

    // Comprehensive test credentials
    testData.testCredentials = {
      passwordReset: {
        validEmails: passwordResetTestEmails.slice(0, 6),
        invalidEmails: passwordResetTestEmails.slice(6),
        validPhones: testPhoneNumbers.slice(0, 6),
        invalidPhones: testPhoneNumbers.slice(6),
        testPasswords: [
          'TestPassword123!',
          'NewPassword456!',
          'ResetPassword789!',
          'SecurePass2024!'
        ],
        expectedFlows: [
          'email_otp',
          'sms_otp', 
          'session_token_validation'
        ]
      },
      registration: {
        newUserEmails: registrationTestEmails,
        newUserPhones: testPhoneNumbers.slice(10, 15),
        roles: ['patient', 'doctor', 'nutritionist'],
        requiredFields: {
          patient: ['firstName', 'lastName', 'email', 'phone', 'age', 'medicalHistory'],
          doctor: ['firstName', 'lastName', 'email', 'phone', 'specialty', 'qualification'],
          nutritionist: ['firstName', 'lastName', 'email', 'phone', 'certification']
        }
      },
      authentication: {
        loginCredentials: testData.users.map(user => ({
          email: user.email,
          password: user.initialPassword || 'TestPassword123!',
          role: user.role
        }))
      }
    }

    // Step-by-step testing guide
    testData.stepByStepGuide = {
      passwordResetTesting: {
        phase: 'Password Reset Flow Testing',
        steps: [
          {
            step: 1,
            title: 'Prepare Test Environment',
            actions: [
              'Open application in browser',
              'Ensure you have access to email account',
              'Clear browser cache/cookies if needed'
            ]
          },
          {
            step: 2,
            title: 'Initiate Password Reset',
            actions: [
              'Navigate to login page',
              'Click "Forgot Password" link',
              `Use test email: ${passwordResetTestEmails[0]}`,
              'Submit password reset request'
            ],
            expectedResult: 'Success message displayed'
          },
          {
            step: 3,
            title: 'Verify Email Delivery',
            actions: [
              'Check email inbox',
              'Look for email from "onboarding@resend.dev"',
              'Verify subject line contains "Password Reset Code"',
              'Check email contains 6-digit OTP'
            ],
            expectedResult: 'Email received within 30 seconds'
          },
          {
            step: 4,
            title: 'Complete Password Reset',
            actions: [
              'Enter 6-digit OTP from email',
              'Set new password (min 8 chars, 1 uppercase, 1 number)',
              'Confirm new password',
              'Submit password update'
            ],
            expectedResult: 'Password updated successfully'
          },
          {
            step: 5,
            title: 'Verify New Password',
            actions: [
              'Go to login page',
              'Login with email and new password',
              'Verify successful login'
            ],
            expectedResult: 'Login successful, redirect to dashboard'
          }
        ]
      },
      registrationTesting: {
        phase: 'Registration Flow Testing',
        steps: [
          {
            step: 1,
            title: 'Start Registration',
            actions: [
              'Navigate to registration page',
              'Select user type (patient/doctor/nutritionist)',
              'Fill required fields with test data'
            ]
          },
          {
            step: 2,
            title: 'Complete Patient Registration',
            actions: [
              'Enter medical information',
              'Proceed to payment step',
              'Use test payment credentials',
              'Complete payment process'
            ],
            expectedResult: 'Registration completed, care team assigned'
          }
        ]
      },
      paymentTesting: {
        phase: 'Payment Flow Testing',
        testScenarios: [
          'Test successful payment',
          'Test payment failure',
          'Test payment timeout',
          'Test payment pending status'
        ]
      }
    }

    console.log(`[Test Data] Created comprehensive test data:`)
    console.log(`- ${testData.users.length} test users`)
    console.log(`- ${testData.passwordResetScenarios.length} password reset scenarios`)
    console.log(`- ${testData.registrationScenarios.length} registration scenarios`)
    console.log(`- ${Object.keys(testData.paymentTestData).length > 0 ? 'Payment test data included' : 'No payment data'}`)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Comprehensive test data created successfully for type: ${type}`,
        data: testData,
        summary: {
          usersCreated: testData.users.length,
          passwordResetScenarios: testData.passwordResetScenarios.length,
          registrationScenarios: testData.registrationScenarios.length,
          paymentScenariosIncluded: Object.keys(testData.paymentTestData).length > 0,
          emailTestingIncluded: Object.keys(testData.emailTestingData).length > 0,
          testingGuideIncluded: Object.keys(testData.stepByStepGuide).length > 0
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Test Data] Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Check edge function logs for more information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
