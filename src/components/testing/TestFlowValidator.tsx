
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TestTube } from 'lucide-react';
import { useTestValidation } from './TestFlowValidator/useTestValidation';
import { TestSuiteCard } from './TestFlowValidator/TestSuiteCard';
import { defaultTestSuites } from './TestFlowValidator/testSuiteData';

export const TestFlowValidator = () => {
  const {
    suites,
    isRunning,
    overallProgress,
    runTestSuite,
    runAllTests,
    resetTests
  } = useTestValidation(defaultTestSuites);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Flow Validator
          </CardTitle>
          <CardDescription>
            Automated testing and validation of core application flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Run All Tests
            </Button>
            <Button 
              variant="outline" 
              onClick={resetTests}
              disabled={isRunning}
            >
              Reset Tests
            </Button>
          </div>

          {isRunning && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
          )}

          <div className="grid gap-6">
            {suites.map((suite, suiteIndex) => (
              <TestSuiteCard
                key={suite.name}
                suite={suite}
                suiteIndex={suiteIndex}
                isRunning={isRunning}
                onRunSuite={runTestSuite}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <TestTube className="h-4 w-4" />
        <AlertDescription>
          This validator tests the core functionality of your application including email delivery, 
          payment processing, user registration, and database operations. Use this to ensure 
          all critical flows are working correctly before deploying to production.
        </AlertDescription>
      </Alert>
    </div>
  );
};
