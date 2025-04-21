
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getEnvironmentInfo } from "@/utils/environmentUtils";

/**
 * This component provides auth debugging information in dev mode
 * It will only render in development mode and helps diagnose auth issues
 * 
 * Button is removed to hide debug toggle from UI but debug info is still collected.
 */
export const AuthDebugMonitor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  
  // Show debug info in development mode or when explicitly enabled via URL
  const isDev = import.meta.env.DEV || 
                window.location.hostname === 'localhost' || 
                window.location.search.includes('debug=true');
  
  useEffect(() => {
    // Always collect debug info, even in production, to help diagnose issues
    const collectDebugInfo = async () => {
      // Get comprehensive environment information
      const envInfo = getEnvironmentInfo();
      
      // Get auth session
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = !!sessionData?.session;
      
      // Get URL hash for deeper auth redirect debugging
      const hashParams = window.location.hash ? 
        Object.fromEntries(new URLSearchParams(window.location.hash.substring(1))) : 
        {};
      
      // Enhanced debugging info
      setDebugInfo({
        ...envInfo,
        hasSession,
        sessionExists: hasSession,
        currentTimestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        hashParams,
        hashType: hashParams.type || 'none',
        accessTokenPresent: !!hashParams.access_token,
        redirectPath: window.location.pathname.includes('/auth') ? 'On auth page' : 'Not on auth page',
        resetPasswordMode: 
          window.location.pathname.includes('/update-password') || 
          hashParams.type === 'recovery' ? 'Active' : 'Inactive',
      });
    };
    
    collectDebugInfo();
    
    // Setup listeners for URL and hash changes which might indicate auth redirects
    const handleHashChange = () => {
      console.log("Hash changed, updating debug info");
      collectDebugInfo();
    };
    
    const handleUrlChange = () => {
      console.log("URL changed, updating debug info");
      collectDebugInfo();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);
  
  // Debug info is collected but no UI button to toggle display
  return null;
};

