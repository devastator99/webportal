
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/utils/environmentUtils";

/**
 * This component provides auth debugging information in dev mode
 * It will only render in development mode and helps diagnose auth issues
 */
export const AuthDebugMonitor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  
  // Only collect debug info in development mode
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
  
  useEffect(() => {
    if (!isDev) return;
    
    const collectDebugInfo = async () => {
      // Get current Supabase URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not available';
      
      // Get current origin
      const origin = window.location.origin;
      const baseUrl = getBaseUrl();
      
      // Get auth session
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = !!sessionData?.session;
      
      setDebugInfo({
        environment: import.meta.env.MODE,
        origin,
        currentUrl: window.location.href,
        baseUrl,
        supabaseUrl,
        hostname: window.location.hostname,
        hasSession,
        userAgent: navigator.userAgent,
      });
    };
    
    collectDebugInfo();
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
