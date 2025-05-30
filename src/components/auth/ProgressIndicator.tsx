
import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-medium">{stepNumber}</span>
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  isCompleted || isCurrent ? 'text-purple-600' : 'text-gray-500'
                }`}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
