
import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { ResponsiveProvider } from './contexts/ResponsiveContext';
import { Navbar } from './components/Navbar';
import { AppRoutes } from './routes/AppRoutes';
import { featureFlags } from './config/features';
import { ChatModule } from './modules/chat/ChatModule';
import React, { useEffect, useState } from 'react';
import { MobileStatusBar } from './components/mobile/MobileStatusBar';
import { MobileNavigation } from './components/mobile/MobileNavigation';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationBell } from './components/notifications/NotificationBell';

function App() {
  // Initialize state with current feature flags
  const [chatEnabled, setChatEnabled] = useState(featureFlags.enableChat);
  const [chatbotWidgetEnabled, setChatbotWidgetEnabled] = useState(featureFlags.enableChatbotWidget);
  const [chatbotVoiceEnabled, setChatbotVoiceEnabled] = useState(featureFlags.enableChatbotVoice);
  
  // Listen for changes to feature flags in localStorage
  useEffect(() => {
    const checkFeatureFlags = () => {
      if (typeof window === 'undefined') return;
      
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
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkFeatureFlags);
      
      // Custom event for when flags change within the same window
      window.addEventListener('featureFlagsChanged', checkFeatureFlags);
      
      return () => {
        window.removeEventListener('storage', checkFeatureFlags);
        window.removeEventListener('featureFlagsChanged', checkFeatureFlags);
      };
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <ResponsiveProvider>
        <div className="app-container">
          <MobileStatusBar />
          <Router>
            <AuthProvider>
              {/* Navbar is available on all routes */}
              <Navbar />
              <div className="mobile-content">
                <ErrorBoundary>
                  {/* Use AppRoutes component for all routing */}
                  <AppRoutes />
                </ErrorBoundary>
              </div>
              
              <MobileNavigation />
              
              {/* Add notification bell alongside chatbot widget */}
              <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-2">
                <div className="self-end">
                  <NotificationBell />
                </div>
                
                {/* Only render the chatbot widget as a chat link button */}
                {chatEnabled && chatbotWidgetEnabled && (
                  <ChatModule showChatInterface={false} showChatbotWidget={true} />
                )}
              </div>
              
              <Toaster position="top-center" />
            </AuthProvider>
          </Router>
        </div>
      </ResponsiveProvider>
    </ThemeProvider>
  );
}

export default App;
