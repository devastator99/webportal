
import React from 'react';
import { RegistrationDataVerifier } from '@/components/testing/RegistrationDataVerifier';
import { PhoneRegistrationDebugger } from '@/components/testing/PhoneRegistrationDebugger';
import { TestDataCleanup } from '@/components/testing/TestDataCleanup';
import { RegistrationTaskProcessor } from '@/components/testing/RegistrationTaskProcessor';

const TestingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Testing Tools</h1>
        
        <RegistrationTaskProcessor />
        
        <TestDataCleanup />
        
        <RegistrationDataVerifier />
        
        <PhoneRegistrationDebugger />
      </div>
    </div>
  );
};

export default TestingPage;
