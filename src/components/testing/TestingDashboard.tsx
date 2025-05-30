
import { TestingStatsCards } from './TestingDashboard/TestingStatsCards';
import { TestingGuideSection } from './TestingDashboard/TestingGuideSection';

export const TestingDashboard = () => {
  return (
    <div className="space-y-6">
      <TestingStatsCards />
      <TestingGuideSection />
    </div>
  );
};
