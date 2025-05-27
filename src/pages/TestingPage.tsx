
import { TestDataManager } from '@/components/testing/TestDataManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, CheckCircle } from 'lucide-react';
import { TestingStatsCards } from '@/components/testing/TestingDashboard/TestingStatsCards';
import { TestingGuideSection } from '@/components/testing/TestingDashboard/TestingGuideSection';

export const TestingPage = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TestTube className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Comprehensive Testing Dashboard</h1>
            <p className="text-gray-600">Complete test data generation and step-by-step testing guide for all application flows</p>
          </div>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            This comprehensive testing system generates real test data that integrates with all app features including 
            email sending (via Resend), SMS, payment processing (Razorpay), and complete user registration flows.
            Follow the step-by-step guide for systematic testing.
          </AlertDescription>
        </Alert>
      </div>

      <TestingStatsCards />
      <TestDataManager />
      <TestingGuideSection />
    </div>
  );
};

export default TestingPage;
