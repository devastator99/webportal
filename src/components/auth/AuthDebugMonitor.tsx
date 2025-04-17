
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl, getAuthRedirectUrl, getProjectId } from "@/utils/environmentUtils";

/**
 * This component provides auth debugging information in dev mode
 * It will only render in development mode and helps diagnose auth issues
 */
export const AuthDebugMonitor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  
  // Show debug info in development mode or when explicitly enabled via URL
  const isDev = import.meta.env.DEV || 
                window.location.hostname === 'localhost' || 
                window.location.search.includes('debug=true');
  
  useEffect(() => {
    if (!isDev) return;
    
    const collectDebugInfo = async () => {
      // Get current Supabase URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not available';
      
      // Get current origin and URLs
      const origin = window.location.origin;
      const baseUrl = getBaseUrl();
      const authRedirectUrl = getAuthRedirectUrl();
      const resetPasswordUrl = getAuthRedirectUrl('/auth?reset=true');
      const projectId = getProjectId();
      
      // Get auth session
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = !!sessionData?.session;
      
      setDebugInfo({
        environment: import.meta.env.MODE,
        origin,
        currentUrl: window.location.href,
        baseUrl,
        authRedirectUrl,
        resetPasswordUrl,
        projectId,
        lovableDomain: projectId ? `${projectId}.lovable.dev` : 'Not on lovable domain',
        supabaseUrl,
        hostname: window.location.hostname,
        port: window.location.port,
        hasSession,
        userAgent: navigator.userAgent,
        queryParams: Object.fromEntries(new URLSearchParams(window.location.search)),
        hash: window.location.hash,
      });
    };
    
    collectDebugInfo();
    
    // Setup a listener for hash changes which might indicate auth redirects
    const handleHashChange = () => {
      collectDebugInfo();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isDev]);
  
  if (!isDev) return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-yellow-500 text-black px-2 py-1 text-xs rounded"
      >
        {isOpen ? 'Hide Auth Debug' : 'Auth Debug'}
      </button>
      
      {isOpen && (
        <div className="bg-black/90 text-white p-4 mt-2 rounded max-w-sm overflow-auto max-h-[70vh]">
          <h3 className="font-bold mb-2">Auth Debug Info</h3>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
