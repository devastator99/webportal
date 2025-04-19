
import React, { useEffect } from 'react';
import { getEnvironmentInfo } from '@/utils/environmentUtils';

export const DeploymentDomainChecker: React.FC = () => {
  useEffect(() => {
    const envInfo = getEnvironmentInfo();
    console.log("Comprehensive Deployment Domain Information:", envInfo);
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const fullUrl = `${protocol}//${hostname}`;
    const origin = window.location.origin;
    
    console.log("Current Full URL:", fullUrl);
    console.log("Current Origin:", origin);
    console.log("Current Hostname:", hostname);
    console.log("Complete URL with path and query:", window.location.href);
    console.log("Auth Reset Redirect URL:", `${origin}/auth/update-password`);
  }, []);

  return null; // This component just logs information, doesn't render anything
};
