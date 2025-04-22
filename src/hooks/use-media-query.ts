
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Initialize with a default value based on current state if possible
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    // Default to false on the server
    return false;
  });

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Initial check
    setMatches(mediaQuery.matches);

    // Create event listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
      console.log(`Media query "${query}" changed to: ${event.matches}`);
    };

    // Use modern event listener API with fallback for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy support for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}
