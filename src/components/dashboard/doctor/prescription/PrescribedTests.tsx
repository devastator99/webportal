
import React from "react";
import { ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Test {
  test_name: string;
  instructions?: string;
}

interface PrescribedTestsProps {
  tests: Test[];
  onRemove?: (index: number) => void;
}

export const PrescribedTests: React.FC<PrescribedTestsProps> = ({ tests, onRemove }) => {
  if (!tests.length) {
    return (
      <div className="text-center p-4 text-gray-500 text-sm">
        No tests prescribed yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {tests.map((test, index) => (
          <div 
            key={index} 
            className="p-3 rounded-lg border bg-white shadow-sm"
          >
            <div className="flex items-start gap-3">
              <ClipboardCheck className="h-5 w-5 text-purple-500 mt-0.5" />
              <div className="space-y-1 flex-grow">
                <h4 className="font-medium">{test.test_name}</h4>
                {test.instructions && (
                  <p className="text-sm text-gray-600">
                    {test.instructions}
                  </p>
                )}
              </div>
              {onRemove && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => onRemove(index)}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
