
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Wait for DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Log initialization to help with debugging
  console.log('DOM content loaded, initializing app...')
  
  const rootElement = document.getElementById("root")
  
  if (rootElement) {
    const root = createRoot(rootElement)
    
    // Render with error boundary
    try {
      root.render(<App />)
      console.log('App successfully rendered')
    } catch (error) {
      console.error('Failed to render app:', error)
      rootElement.innerHTML = '<div style="color: red; padding: 20px;">Application failed to load. Please check the console for errors.</div>'
    }
  } else {
    console.error('Root element not found')
  }
})
