
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
    // Look for password reset parameters in both hash and query parameters
    const hash = location.hash;
    const searchParams = new URLSearchParams(location.search);
    
    // Check if this is a recovery flow (password reset)
    const isRecoveryInHash = hash && hash.includes('type=recovery');
    const isRecoveryInQuery = searchParams.get('type') === 'recovery';
    
    if (isRecoveryInHash || isRecoveryInQuery) {
      console.log('Detected password reset parameters, redirecting to /update-password');
      
      // Preserve all parameters by combining hash and search params
      let params = new URLSearchParams();
      
      // Add query parameters
      searchParams.forEach((value, key) => {
        params.append(key, value);
      });
      
      // Add hash parameters if they exist
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        hashParams.forEach((value, key) => {
          // Don't duplicate parameters that are already in the query
          if (!params.has(key)) {
            params.append(key, value);
          }
        });
      }
      
      // Redirect to update-password with all parameters
      navigate(`/update-password?${params.toString()}`, { replace: true });
    }
  }, [location, navigate]);
  
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
