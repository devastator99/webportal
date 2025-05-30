
import React from 'react';
import { EnhancedRegistrationProgress } from '@/components/registration/EnhancedRegistrationProgress';

interface RegistrationProgressReportProps {
  onComplete?: () => void;
  userRole?: string | null;
}

export const RegistrationProgressReport: React.FC<RegistrationProgressReportProps> = (props) => {
  return <EnhancedRegistrationProgress {...props} />;
};
