
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  generatePasswordResetTestEmails,
  generateTestPhoneNumbers,
  generateRegistrationTestEmails,
  generatePaymentTestData,
  generateEmailTestingData
} from './testDataGenerators.ts'
import { createTestUser } from './userCreationService.ts'

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

    const passwordResetTestEmails = generatePasswordResetTestEmails()
    const testPhoneNumbers = generateTestPhoneNumbers()
    const registrationTestEmails = generateRegistrationTestEmails()

    if (type === 'password_reset' || type === 'full' || type === 'email_testing') {
      console.log('[Test Data] Creating password reset and email testing users...')
      
      const userRoles = ['patient', 'doctor', 'nutritionist', 'administrator']
      
      for (let i = 0; i < Math.min(count, passwordResetTestEmails.length); i++) {
        const email = passwordResetTestEmails[i]
        const phone = testPhoneNumbers[i]
        const role = userRoles[i % userRoles.length]
        
        const user = await createTestUser(supabase, email, phone, role, i)
        if (user) {
          testData.users.push(user)
          
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
      }
    }

    if (type === 'registration' || type === 'full') {
      console.log('[Test Data] Creating registration test scenarios...')
      
      testData.registrationScenarios = [
        {
          email: 'test.complete.patient.reg@example.com',
          phone: '+91-9999-201-001',
          role: 'patient',
          firstName: 'TestPatient',
          lastName: 'CompleteReg',
          scenario: 'complete_registration',
          description: 'Complete patient registration with payment'
        }
      ]
    }

    if (type === 'payment' || type === 'full') {
      console.log('[Test Data] Creating comprehensive payment test data...')
      testData.paymentTestData = generatePaymentTestData()
    }

    if (type === 'email_testing' || type === 'full') {
      console.log('[Test Data] Creating email testing configuration...')
      testData.emailTestingData = generateEmailTestingData()
    }

    // Generate test credentials and step-by-step guide
    testData.testCredentials = {
      passwordReset: {
        validEmails: passwordResetTestEmails.slice(0, 6),
        invalidEmails: passwordResetTestEmails.slice(6),
        testPasswords: ['TestPassword123!', 'NewPassword456!']
      }
    }

    console.log(`[Test Data] Created comprehensive test data:`)
    console.log(`- ${testData.users.length} test users`)
    console.log(`- ${testData.passwordResetScenarios.length} password reset scenarios`)
    
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
          emailTestingIncluded: Object.keys(testData.emailTestingData).length > 0
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
