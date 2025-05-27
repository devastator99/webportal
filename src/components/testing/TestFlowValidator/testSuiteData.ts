
import { Mail, Users, CreditCard } from 'lucide-react';
import { TestSuite } from './types';

export const defaultTestSuites: TestSuite[] = [
  {
    name: 'Password Reset Flow',
    icon: Mail,
    color: 'blue',
    validations: [
      {
        name: 'Email OTP Generation',
        description: 'Test OTP generation for password reset',
        status: 'pending'
      },
      {
        name: 'Email Delivery',
        description: 'Test actual email delivery via Resend',
        status: 'pending'
      },
      {
        name: 'OTP Validation',
        description: 'Test OTP verification process',
        status: 'pending'
      },
      {
        name: 'Password Update',
        description: 'Test password update functionality',
        status: 'pending'
      }
    ]
  },
  {
    name: 'Registration Flow',
    icon: Users,
    color: 'green',
    validations: [
      {
        name: 'User Creation',
        description: 'Test user account creation',
        status: 'pending'
      },
      {
        name: 'Profile Setup',
        description: 'Test profile information setup',
        status: 'pending'
      },
      {
        name: 'Payment Processing',
        description: 'Test registration payment flow',
        status: 'pending'
      },
      {
        name: 'Care Team Assignment',
        description: 'Test automatic care team assignment',
        status: 'pending'
      }
    ]
  },
  {
    name: 'Payment Integration',
    icon: CreditCard,
    color: 'purple',
    validations: [
      {
        name: 'Order Creation',
        description: 'Test Razorpay order creation',
        status: 'pending'
      },
      {
        name: 'Payment Success',
        description: 'Test successful payment processing',
        status: 'pending'
      },
      {
        name: 'Payment Failure',
        description: 'Test payment failure handling',
        status: 'pending'
      },
      {
        name: 'Status Updates',
        description: 'Test payment status synchronization',
        status: 'pending'
      }
    ]
  }
];
