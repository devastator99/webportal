
export interface TestValidation {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  details?: string;
  duration?: number;
}

export interface TestSuite {
  name: string;
  icon: any;
  color: string;
  validations: TestValidation[];
}
