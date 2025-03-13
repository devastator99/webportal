
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Immediately create a minimal QueryClient to reduce initialization time
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // No retries for faster initial load
      refetchOnWindowFocus: false,
      staleTime: 120000, // Further increase stale time to reduce refetches
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      retry: 0,
    }
  },
});

// Create root before DOM content is loaded for faster initialization
const rootElement = document.getElementById("root");

// Use a self-invoking function to avoid delaying render
(function() {
  if (rootElement) {
    // Create root synchronously
    const root = createRoot(rootElement);
    
    // Render immediately without waiting for full document load
    root.render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
  } else {
    console.error('Root element not found');
  }
})();
