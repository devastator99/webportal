
import React, { useEffect } from 'react';

export const PatientDetailsMeta = () => {
  useEffect(() => {
    // Get the current viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    
    // If it doesn't exist, create it
    if (!viewportMeta) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(meta);
    } else {
      // Update existing viewport meta
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    // Clean up function to restore original viewport meta when component unmounts
    return () => {
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta) {
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  return null; // This component doesn't render anything
};
