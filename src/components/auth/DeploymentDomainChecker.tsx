
import React, { useEffect } from 'react';
import { getEnvironmentInfo } from '@/utils/environmentUtils';

export const DeploymentDomainChecker: React.FC = () => {
  useEffect(() => {
    const envInfo = getEnvironmentInfo();
    console.log("Comprehensive Deployment Domain Information:", envInfo);
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const fullUrl = `${protocol}//${hostname}`;
    
    console.log("Current Full URL:", fullUrl);
    console.log("Current Hostname:", hostname);
  }, []);

  return null; // This component just logs information, doesn't render anything
};
