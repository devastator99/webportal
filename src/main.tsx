
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Create a client with more robust error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Query error:', error);
      }
    }
  }
})

// Wait for DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Log initialization to help with debugging
  console.log('DOM content loaded, initializing app...')
  
  const rootElement = document.getElementById("root")
  
  if (rootElement) {
    const root = createRoot(rootElement)
    
    // Render with error boundary
    try {
      root.render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      )
      console.log('App successfully rendered')
    } catch (error) {
      console.error('Failed to render app:', error)
      rootElement.innerHTML = '<div style="color: red; padding: 20px;">Application failed to load. Please check the console for errors.</div>'
    }
  } else {
    console.error('Root element not found')
  }
})
