
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTestDataRequest {
  type: 'full' | 'password_reset' | 'registration' | 'payment';
  count?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type = 'full', count = 5 }: CreateTestDataRequest = await req.json()
    
    console.log(`[Test Data] Creating test data of type: ${type}`)
    
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
      paymentTestData: {}
    }

    // Test Email Addresses for Password Reset Testing
    const passwordResetTestEmails = [
      'test.password.reset@example.com',
      'test.patient.reset@healthcare.test',
      'test.doctor.reset@healthcare.test',
      'test.admin.reset@healthcare.test',
      'test.invalid.reset@nonexistent.test'
    ]

    // Test Phone Numbers (Non-functional but valid format)
    const testPhoneNumbers = [
      '+91-9999-000-001',
      '+91-9999-000-002', 
      '+91-9999-000-003',
      '+91-9999-000-004',
      '+91-9999-000-005'
    ]

    if (type === 'password_reset' || type === 'full') {
      console.log('[Test Data] Creating password reset test users...')
      
      for (let i = 0; i < Math.min(count, passwordResetTestEmails.length); i++) {
        const email = passwordResetTestEmails[i]
        const phone = testPhoneNumbers[i]
        
        try {
          // Create test user in auth
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: {
              test_user: true,
              purpose: 'password_reset_testing'
            }
          })

          if (authError) {
            console.log(`[Test Data] Auth user exists or error for ${email}:`, authError.message)
            continue
          }

          if (authUser.user) {
            // Create profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: authUser.user.id,
                first_name: `Test${i + 1}`,
                last_name: 'PasswordReset',
                email: email,
                phone_number: phone,
                emergency_contact: phone,
                updated_at: new Date().toISOString()
              })

            if (profileError) {
              console.log(`[Test Data] Profile error for ${email}:`, profileError.message)
            }

            // Assign role (mix of patient and doctor for testing)
            const role = i % 2 === 0 ? 'patient' : 'doctor'
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
              purpose: 'password_reset_testing'
            })

            // Create password reset test scenarios
            testData.passwordResetScenarios.push({
              email,
              phone,
              role,
              testPassword: 'NewTestPassword123!',
              expectedFlow: 'email_otp',
              description: `Test password reset for ${role} user via email`
            })
          }
        } catch (error) {
          console.log(`[Test Data] Error creating user ${email}:`, error.message)
        }
      }
    }

    if (type === 'registration' || type === 'full') {
      console.log('[Test Data] Creating registration test data...')
      
      const registrationTestData = [
        {
          email: 'test.new.patient@example.com',
          phone: '+91-9999-001-001',
          role: 'patient',
          firstName: 'NewPatient',
          lastName: 'TestUser'
        },
        {
          email: 'test.new.doctor@example.com', 
          phone: '+91-9999-001-002',
          role: 'doctor',
          firstName: 'NewDoctor',
          lastName: 'TestUser'
        }
      ]

      testData.testCredentials.registration = registrationTestData
    }

    if (type === 'payment' || type === 'full') {
      console.log('[Test Data] Creating payment test data...')
      
      testData.paymentTestData = {
        razorpay: {
          test_key_id: 'rzp_test_1234567890',
          test_key_secret: 'test_secret_key_here',
          test_order_ids: [
            'order_test_001',
            'order_test_002',
            'order_test_003'
          ],
          test_payment_scenarios: [
            {
              scenario: 'success',
              payment_id: 'pay_test_success_001',
              order_id: 'order_test_001',
              amount: 50000, // ₹500
              status: 'captured'
            },
            {
              scenario: 'failure',
              payment_id: 'pay_test_failure_001',
              order_id: 'order_test_002', 
              amount: 50000,
              status: 'failed',
              error_code: 'BAD_REQUEST_ERROR'
            },
            {
              scenario: 'pending',
              payment_id: 'pay_test_pending_001',
              order_id: 'order_test_003',
              amount: 50000,
              status: 'created'
            }
          ]
        }
      }
    }

    // Add comprehensive test credentials
    testData.testCredentials = {
      ...testData.testCredentials,
      passwordReset: {
        emails: passwordResetTestEmails,
        phones: testPhoneNumbers,
        testPasswords: [
          'TestPassword123!',
          'NewPassword456!',
          'ResetPassword789!'
        ],
        flows: [
          'email_otp',
          'sms_otp',
          'session_token'
        ]
      },
      emailTesting: {
        validEmails: passwordResetTestEmails.slice(0, 4),
        invalidEmail: 'test.invalid.reset@nonexistent.test',
        expectedSubject: 'Password Reset Code - Healthcare App',
        expectedSender: 'onboarding@resend.dev'
      },
      smsTesting: {
        validPhones: testPhoneNumbers.slice(0, 4),
        invalidPhone: '+91-0000-000-000',
        expectedFormat: '6-digit OTP code'
      }
    }

    console.log(`[Test Data] Created ${testData.users.length} test users`)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Test data created successfully for type: ${type}`,
        data: testData,
        summary: {
          usersCreated: testData.users.length,
          passwordResetScenarios: testData.passwordResetScenarios.length,
          testCredentialsIncluded: Object.keys(testData.testCredentials).length > 0,
          paymentTestDataIncluded: Object.keys(testData.paymentTestData).length > 0
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Test Data] Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
