
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
import { DeploymentDomainChecker } from './components/auth/DeploymentDomainChecker';
import { supabase } from './integrations/supabase/client';
import { toast } from 'sonner';

// Auth token processor component to handle redirects
const AuthTokenProcessor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const processAuthToken = async () => {
      // Check URL parameters for recovery token
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      const token = urlParams.get('token');
      const hash = location.hash;
      
      console.log("URL check:", { 
        pathname: location.pathname,
        search: location.search, 
        hash,
        type,
        token: token ? "Token present" : "No token"
      });
      
      // Handle recovery URL parameter (from email links)
      if (type === 'recovery' && token) {
        console.log("Recovery token detected in URL parameters");
        
        try {
          // Get the session which will process the token
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error processing token:", error);
            toast.error("Password reset link is invalid or has expired");
          } else if (data?.session) {
            console.log("Successfully processed recovery token");
            toast.success("Password reset link is valid. Please set your new password.");
            // Redirect to update password form
            navigate('/auth/update-password');
          }
        } catch (error) {
          console.error("Exception processing token:", error);
          toast.error("Failed to process password reset link");
        }
      }
      
      // Also handle password reset tokens in URL hash
      else if ((hash && hash.includes('type=recovery'))) {
        console.log("Recovery token detected in URL hash");
        
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error processing hash token:", error);
            toast.error("Password reset link is invalid or has expired");
          } else if (data?.session) {
            console.log("Successfully processed recovery token from hash");
            toast.success("Password reset link is valid. Please set your new password.");
            navigate('/auth/update-password');
          }
        } catch (error) {
          console.error("Exception processing hash token:", error);
          toast.error("Failed to process password reset link");
        }
      }
    };
    
    processAuthToken();
  }, [location, navigate]);
  
  return null;
};

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
              {/* Add the AuthTokenProcessor to handle token processing */}
              <AuthTokenProcessor />
              
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
              
              {/* Always show Auth debug monitor to help diagnose auth issues */}
              <AuthDebugMonitor />
              
              {/* Add DeploymentDomainChecker to log domain information */}
              <DeploymentDomainChecker />
              
              <Toaster position="top-center" />
            </AuthProvider>
          </Router>
        </div>
      </ResponsiveProvider>
    </ThemeProvider>
  );
}

export default App;
