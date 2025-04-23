
import React from "react";
import { ClipboardCheck } from "lucide-react";

interface Test {
  test_name: string;
  instructions?: string;
}

interface PrescribedTestsProps {
  tests: Test[];
}

export const PrescribedTests: React.FC<PrescribedTestsProps> = ({ tests }) => {
  if (!tests.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Prescribed Tests</h3>
      <div className="grid gap-3">
        {tests.map((test, index) => (
          <div 
            key={index} 
            className="p-3 rounded-lg border bg-white shadow-sm"
          >
            <div className="flex items-start gap-3">
              <ClipboardCheck className="h-5 w-5 text-purple-500 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium">{test.test_name}</h4>
                {test.instructions && (
                  <p className="text-sm text-gray-600">
                    {test.instructions}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
