
import React, { useEffect } from 'react';
import { getEnvironmentInfo } from '@/utils/environmentUtils';

export const DeploymentDomainChecker: React.FC = () => {
  useEffect(() => {
    // Log comprehensive environment information for debugging auth issues
    const envInfo = getEnvironmentInfo();
    console.log("Deployment Environment Information:", envInfo);
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const fullUrl = `${protocol}//${hostname}`;
    const queryParams = new URLSearchParams(window.location.search);
    
    console.log("Current Full URL:", fullUrl);
    console.log("Current Hostname:", hostname);
    console.log("Path:", window.location.pathname);
    console.log("Search:", window.location.search);
    
    // Check for auth error or recovery params that could indicate issues
    if (queryParams.has('error') || queryParams.has('error_description')) {
      console.error("Auth error detected in URL parameters:", {
        error: queryParams.get('error'),
        description: queryParams.get('error_description')
      });
    }
    
    if (queryParams.has('type') && queryParams.get('type') === 'recovery') {
      console.log("Recovery flow detected in URL");
    }
    
    // Log auth configuration
    console.log("Expected auth redirect URL:", `${window.location.origin}/auth?view=update_password`);
  }, []);

  // This component just logs information for debugging, doesn't render anything
  return null;
};
