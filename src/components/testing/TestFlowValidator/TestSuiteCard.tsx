
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { TestSuite, TestValidation } from './types';

interface TestSuiteCardProps {
  suite: TestSuite;
  suiteIndex: number;
  isRunning: boolean;
  onRunSuite: (index: number) => void;
}

const getStatusIcon = (status: TestValidation['status']) => {
  switch (status) {
    case 'passed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'failed':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'running':
      return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: TestValidation['status']) => {
  switch (status) {
    case 'passed':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'failed':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'running':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const TestSuiteCard = ({ suite, suiteIndex, isRunning, onRunSuite }: TestSuiteCardProps) => {
  return (
    <Card className="border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <suite.icon className={`h-5 w-5 text-${suite.color}-600`} />
            {suite.name}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRunSuite(suiteIndex)}
            disabled={isRunning}
          >
            Run Suite
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suite.validations.map((validation, validationIndex) => (
            <div 
              key={validation.name}
              className={`p-3 rounded border ${getStatusColor(validation.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(validation.status)}
                  <div>
                    <h4 className="font-medium">{validation.name}</h4>
                    <p className="text-sm opacity-75">{validation.description}</p>
                    {validation.details && (
                      <p className="text-xs mt-1 opacity-60">{validation.details}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={validation.status === 'passed' ? 'default' : 
                           validation.status === 'failed' ? 'destructive' : 'secondary'}
                  >
                    {validation.status}
                  </Badge>
                  {validation.duration && (
                    <p className="text-xs mt-1 opacity-60">
                      {validation.duration}ms
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
