
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Create a minimal QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // No retries for faster initial load
      refetchOnWindowFocus: false,
      staleTime: 300000, // 5 minutes - longer stale time to reduce unnecessary fetches
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      retry: 0,
    }
  },
});

// Get root element directly instead of waiting for DOMContentLoaded
const rootElement = document.getElementById("root");

// Use immediate execution
if (rootElement) {
  // Create root synchronously
  const root = createRoot(rootElement);
  
  // Render immediately
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
} else {
  console.error('Root element not found');
}
