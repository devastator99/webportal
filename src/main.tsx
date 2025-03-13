
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Create a client with lightweight defaults for faster initialization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // Reduce retries for faster initial load
      refetchOnWindowFocus: false,
      staleTime: 60000, // Increase stale time to reduce refetches
    },
    mutations: {
      retry: 0,
    }
  },
})

// Create root before DOM content is loaded, defer rendering
const rootElement = document.getElementById("root")
const root = rootElement ? createRoot(rootElement) : null

// Render with minimal initial work
if (root) {
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
  console.log('App rendered')
} else {
  console.error('Root element not found')
}
