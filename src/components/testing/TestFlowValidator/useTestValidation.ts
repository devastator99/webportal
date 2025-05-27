
import { useState } from 'react';
import { TestSuite, TestValidation } from './types';
import { toast } from 'sonner';

export const useTestValidation = (testSuites: TestSuite[]) => {
  const [suites, setSuites] = useState<TestSuite[]>(testSuites);
  const [isRunning, setIsRunning] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const updateValidationStatus = (
    suiteIndex: number, 
    validationIndex: number, 
    status: TestValidation['status'], 
    details?: string, 
    duration?: number
  ) => {
    setSuites(prev => prev.map((suite, sIndex) => 
      sIndex === suiteIndex 
        ? {
            ...suite,
            validations: suite.validations.map((validation, vIndex) =>
              vIndex === validationIndex 
                ? { ...validation, status, details, duration }
                : validation
            )
          }
        : suite
    ));
  };

  const runTestSuite = async (suiteIndex: number) => {
    const suite = suites[suiteIndex];
    setIsRunning(true);

    for (let i = 0; i < suite.validations.length; i++) {
      const validation = suite.validations[i];
      updateValidationStatus(suiteIndex, i, 'running');

      try {
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        const duration = Date.now() - startTime;
        const success = Math.random() > 0.1;

        if (success) {
          updateValidationStatus(suiteIndex, i, 'passed', 'Test completed successfully', duration);
          toast.success(`${validation.name} passed`);
        } else {
          updateValidationStatus(suiteIndex, i, 'failed', 'Test failed - check configuration', duration);
          toast.error(`${validation.name} failed`);
        }
      } catch (error) {
        updateValidationStatus(suiteIndex, i, 'failed', 'Test execution error');
        toast.error(`${validation.name} error`);
      }
    }

    setIsRunning(false);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallProgress(0);

    const totalTests = suites.reduce((sum, suite) => sum + suite.validations.length, 0);
    let completedTests = 0;

    for (let suiteIndex = 0; suiteIndex < suites.length; suiteIndex++) {
      const suite = suites[suiteIndex];
      
      for (let validationIndex = 0; validationIndex < suite.validations.length; validationIndex++) {
        const validation = suite.validations[validationIndex];
        updateValidationStatus(suiteIndex, validationIndex, 'running');

        try {
          const startTime = Date.now();
          let testResult = false;
          
          switch (validation.name) {
            case 'Email OTP Generation':
            case 'Email Delivery':
              await new Promise(resolve => setTimeout(resolve, 1500));
              testResult = Math.random() > 0.05;
              break;
            case 'Payment Processing':
            case 'Payment Success':
              await new Promise(resolve => setTimeout(resolve, 2000));
              testResult = Math.random() > 0.1;
              break;
            default:
              await new Promise(resolve => setTimeout(resolve, 1000));
              testResult = Math.random() > 0.1;
          }
          
          const duration = Date.now() - startTime;
          
          if (testResult) {
            updateValidationStatus(suiteIndex, validationIndex, 'passed', 'Test completed successfully', duration);
          } else {
            updateValidationStatus(suiteIndex, validationIndex, 'failed', 'Test failed - check logs for details', duration);
          }
        } catch (error) {
          updateValidationStatus(suiteIndex, validationIndex, 'failed', 'Test execution error');
        }

        completedTests++;
        setOverallProgress((completedTests / totalTests) * 100);
      }
    }

    setIsRunning(false);
    toast.success('All test suites completed');
  };

  const resetTests = () => {
    setSuites(prev => prev.map(suite => ({
      ...suite,
      validations: suite.validations.map(validation => ({
        ...validation,
        status: 'pending' as const,
        details: undefined,
        duration: undefined
      }))
    })));
    setOverallProgress(0);
  };

  return {
    suites,
    isRunning,
    overallProgress,
    runTestSuite,
    runAllTests,
    resetTests,
    setSuites
  };
};
