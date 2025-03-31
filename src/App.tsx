
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AlternativeDashboard from './pages/AlternativeDashboard';
import Admin from './pages/Admin';
import PatientsView from './pages/PatientsView';
import { featureFlags } from './config/features';
import { ChatModule } from './modules/chat/ChatModule';
import { useEffect, useState } from 'react';
import { MobileStatusBar } from './components/mobile/MobileStatusBar';
import { MobileNavigation } from './components/mobile/MobileNavigation';

function App() {
  // Initialize state with current feature flags
  const [chatEnabled, setChatEnabled] = useState(featureFlags.enableChat);
  const [chatbotWidgetEnabled, setChatbotWidgetEnabled] = useState(featureFlags.enableChatbotWidget);
  const [chatbotVoiceEnabled, setChatbotVoiceEnabled] = useState(featureFlags.enableChatbotVoice);
  
  // Listen for changes to feature flags in localStorage
  useEffect(() => {
    const checkFeatureFlags = () => {
      const savedFlags = localStorage.getItem('featureFlags');
      if (savedFlags) {
        const parsedFlags = JSON.parse(savedFlags);
        setChatEnabled(parsedFlags.enableChat);
        setChatbotWidgetEnabled(parsedFlags.enableChatbotWidget);
        setChatbotVoiceEnabled(parsedFlags.enableChatbotVoice);
      }
    };
    
    // Check initially
    checkFeatureFlags();
    
    // Set up event listener for storage changes
    window.addEventListener('storage', checkFeatureFlags);
    
    // Custom event for when flags change within the same window
    window.addEventListener('featureFlagsChanged', checkFeatureFlags);
    
    return () => {
      window.removeEventListener('storage', checkFeatureFlags);
      window.removeEventListener('featureFlagsChanged', checkFeatureFlags);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="app-container">
        <MobileStatusBar />
        <Router>
          <AuthProvider>
            <div className="mobile-content">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard/*" element={<Dashboard />} />
                <Route path="/dashboard-alt" element={<AlternativeDashboard />} />
                <Route path="/admin/*" element={<Admin />} />
                <Route path="/patients" element={<PatientsView />} />
              </Routes>
            </div>
            
            <MobileNavigation />
            
            {/* Only render the chatbot widget if chat is enabled */}
            {chatEnabled && chatbotWidgetEnabled && (
              <ChatModule showChatInterface={false} showChatbotWidget={true} />
            )}
            
            <Toaster position="top-center" />
          </AuthProvider>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
