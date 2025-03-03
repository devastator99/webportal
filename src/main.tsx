
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create root once the DOM is fully loaded to ensure better performance
document.addEventListener('DOMContentLoaded', () => {
  createRoot(document.getElementById("root")!).render(<App />);
});
