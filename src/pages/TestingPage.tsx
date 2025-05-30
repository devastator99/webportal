
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestingDashboard } from '@/components/testing/TestingDashboard';
import { TestDataCleanup } from '@/components/testing/TestDataCleanup';
import { SpecificUserDeletion } from '@/components/testing/SpecificUserDeletion';

const TestingPage = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Testing & Development Tools</h1>
        <p className="text-gray-600">
          Tools for testing, debugging, and managing the application in development
        </p>
      </div>

      <div className="grid gap-8">
        <SpecificUserDeletion />
        <TestDataCleanup />
        <TestingDashboard />
      </div>
    </div>
  );
};

export default TestingPage;
