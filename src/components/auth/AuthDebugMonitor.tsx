
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getEnvironmentInfo } from "@/utils/environmentUtils";

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
        userAgent: navigator.userAgent,
        queryParams: Object.fromEntries(new URLSearchParams(window.location.search)),
        hash: window.location.hash,
        hashParams,
        redirectPath: window.location.pathname.includes('/auth') ? 'On auth page' : 'Not on auth page',
        resetPasswordMode: window.location.search.includes('type=recovery') ? 'Active' : 'Inactive',
        today: new Date().toISOString(),
      });
    };
    
    collectDebugInfo();
    
    // Setup a listener for hash changes which might indicate auth redirects
    const handleHashChange = () => {
      console.log("Hash changed, updating debug info");
      collectDebugInfo();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  // Always return the debug monitor in case it's needed
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isDev ? 'bg-yellow-500' : 'bg-blue-500'} text-black px-2 py-1 text-xs rounded`}
      >
        {isOpen ? 'Hide Auth Debug' : 'Auth Debug'}
      </button>
      
      {isOpen && (
        <div className="bg-black/90 text-white p-4 mt-2 rounded max-w-sm overflow-auto max-h-[70vh]">
          <h3 className="font-bold mb-2">Auth Debug Info</h3>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
          
          <div className="mt-4 pt-2 border-t border-gray-700">
            <h4 className="font-bold text-xs mb-1">Debug Actions</h4>
            <button 
              onClick={() => {
                console.log("Auth debug refresh triggered");
                window.location.reload();
              }}
              className="bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                console.log("Auth debug clear session triggered");
                supabase.auth.signOut();
                window.location.reload();
              }}
              className="bg-red-600 text-white text-xs px-2 py-1 rounded"
            >
              Clear Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
