
import { useEffect, useState } from 'react';

// Online status check
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
    ? navigator.onLine 
    : true;
};

// Hook to track online status
export const useOnlineStatus = (): boolean => {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
};

// Hook to track connection quality
export const useConnectionQuality = () => {
  const online = useOnlineStatus();
  const [connectionQuality, setConnectionQuality] = useState<'good'|'poor'|'offline'>(
    online ? 'good' : 'offline'
  );

  useEffect(() => {
    if (!online) {
      setConnectionQuality('offline');
      return;
    }

    // Check connection quality through navigation timing API
    const checkConnectionQuality = () => {
      if ('connection' in navigator && (navigator as any).connection) {
        const connection = (navigator as any).connection;
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setConnectionQuality('poor');
        } else {
          setConnectionQuality('good');
        }
      }
    };

    checkConnectionQuality();
    
    // Try to listen for connection changes if available
    if ('connection' in navigator && (navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', checkConnectionQuality);
      return () => {
        (navigator as any).connection.removeEventListener('change', checkConnectionQuality);
      };
    }
  }, [online]);

  return connectionQuality;
};
