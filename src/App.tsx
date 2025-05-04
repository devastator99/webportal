import './App.css';
import './styles/glass.css';
import './styles/ai-chat.css';
import './components/ui/sidebar-variables.css';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ui/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ResponsiveProvider } from './contexts/ResponsiveContext';
import { Navbar } from './components/Navbar';
import { AppRoutes } from './routes/AppRoutes';
import { useState, useEffect } from 'react';
import { MobileStatusBar } from './components/mobile/MobileStatusBar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationBell } from './components/notifications/NotificationBell';
import { AuthDebugMonitor } from './components/auth/AuthDebugMonitor';
import { SidebarProvider } from './components/ui/sidebar';

// Password reset redirect function
function PasswordResetRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const hash = location.hash;
    const searchParams = new URLSearchParams(location.search);
    
    const isRecoveryInHash = hash && hash.includes('type=recovery');
    const isRecoveryInQuery = searchParams.get('type') === 'recovery';
    
    if (isRecoveryInHash || isRecoveryInQuery) {
      console.log('Detected password reset parameters, redirecting to /update-password');
      
      let params = new URLSearchParams();
      
      searchParams.forEach((value, key) => {
        params.append(key, value);
      });
      
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        hashParams.forEach((value, key) => {
          if (!params.has(key)) {
            params.append(key, value);
          }
        });
      }
      
      navigate(`/update-password?${params.toString()}`, { replace: true });
    }
  }, [location, navigate]);
  
  return null;
}

// Custom component to conditionally show the correct navbar based on route
function ConditionalNavbar() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
  // We'll now render navbar from individual pages instead
  // to avoid duplication and allow passing props
  if (isLandingPage) {
    return null; // The LandingPage component will render LandingNavbar
  }
  
  return <Navbar />;
}

// SessionManager to handle browser events for authentication
function SessionManager() {
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    // No need for handling beforeunload as we're doing it in AuthService
    
    // Handle page visibility changes for session validation
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('Tab became visible, checking session validity');
        // We could add additional session validation here if needed
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, signOut]);

  return null; // This is just a behavior component, no rendering
}

function App() {
  const [chatEnabled] = useState(false);
  const [chatbotWidgetEnabled] = useState(false);
  const [chatbotVoiceEnabled] = useState(false);

  return (
    <ThemeProvider defaultTheme="light" storageKey="theme">
      <ResponsiveProvider>
        <div className="app-container">
          <MobileStatusBar />
          <Router>
            <PasswordResetRedirect />
            <AuthProvider>
              <SessionManager />
              <ConditionalNavbar />
              <ErrorBoundary fallback={
                <div className="container mx-auto p-4 mt-24 text-center">
                  <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
                  <p>We're sorry, but there was an error loading this page.</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-[#9b87f5] text-white rounded-md hover:bg-[#7E69AB]"
                  >
                    Reload Page
                  </button>
                </div>
              }>
                <div className="mobile-content pt-0 min-h-[calc(100vh-70px)]">
                  <AppRoutes />
                </div>
              </ErrorBoundary>
              
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
