
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
    
    // Enhanced recovery detection and debugging
    const recoveryToken = queryParams.get('token');
    const recoveryType = queryParams.get('type');
    
    if (recoveryType === 'recovery') {
      console.log("Recovery flow detected in URL");
      console.log("Recovery token present:", !!recoveryToken);
      console.log("Expected redirect to:", `${window.location.origin}/auth?view=update_password`);
      
      // Debug Supabase recovery URL format
      const referrer = document.referrer;
      if (referrer && referrer.includes('supabase')) {
        console.log("Referred from Supabase:", referrer);
      }
    }
    
    // Log auth configuration
    console.log("Expected auth redirect URL:", `${window.location.origin}/auth?view=update_password`);
  }, []);

  // This component just logs information for debugging, doesn't render anything
  return null;
};
