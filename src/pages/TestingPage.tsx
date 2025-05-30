
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestingDashboard } from "@/components/testing/TestingDashboard";
import { TwilioConfigValidator } from "@/components/testing/TwilioConfigValidator";
import { UserPhoneChecker } from "@/components/testing/UserPhoneChecker";

const TestingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Testing & Validation Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Comprehensive testing tools for validating system functionality
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserPhoneChecker />
          <TwilioConfigValidator />
        </div>

        <TestingDashboard />
      </div>
    </div>
  );
};

export default TestingPage;
