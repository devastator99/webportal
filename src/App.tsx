
import './App.css';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
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
import { AuthDebugMonitor } from './components/auth/AuthDebugMonitor';

// Component to handle password reset URL hash fragments
function PasswordResetRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check for Supabase password reset hash format (#access_token=...&refresh_token=...&type=recovery)
    const hash = location.hash;
    
    if (hash && hash.includes('type=recovery')) {
      console.log('Detected password reset hash fragment, redirecting to /update-password');
      
      // Redirect to update-password page with the hash parameters as query params
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams();
      
      // Convert hash params to query params for easier processing
      hashParams.forEach((value, key) => {
        queryParams.append(key, value);
      });
      
      // Redirect to update-password with the query params
      navigate(`/update-password?${queryParams.toString()}`, { replace: true });
    }
  }, [location.hash, navigate]);
  
  return null;
}

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
            <PasswordResetRedirect />
            <AuthProvider>
              <Navbar />
              <div className="mobile-content">
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </div>
              
              <MobileNavigation />
              
              <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-2">
                <div className="self-end">
                  <NotificationBell />
                </div>
                
                {chatEnabled && chatbotWidgetEnabled && (
                  <ChatModule showChatInterface={false} showChatbotWidget={true} />
                )}
              </div>
              
              <AuthDebugMonitor />
              <Toaster position="top-center" />
            </AuthProvider>
          </Router>
        </div>
      </ResponsiveProvider>
    </ThemeProvider>
  );
}

export default App;
