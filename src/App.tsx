import './App.css';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
// import { ThemeProvider } from './contexts/ThemeProvider';
import { ThemeProvider } from './components/ui/theme-provider';
import { AuthProvider } from './contexts/AuthContext';
import { ResponsiveProvider } from './contexts/ResponsiveContext';
import { Navbar } from './components/Navbar';
import { AppRoutes } from './routes/AppRoutes';
import { useState, useEffect } from 'react';
import { MobileStatusBar } from './components/mobile/MobileStatusBar';
import { MobileNavigation } from './components/mobile/MobileNavigation';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationBell } from './components/notifications/NotificationBell';
import { AuthDebugMonitor } from './components/auth/AuthDebugMonitor';
import { LandingNavbar } from './components/landing/LandingNavbar';

// Simplified conditional navbar
function ConditionalNavbar() {
  const location = useLocation();
  return location.pathname !== '/' ? <Navbar /> : null;
}

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

 newlanding
=======
// Custom component to conditionally show the correct navbar based on route
function ConditionalNavbar() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
  // Only render the appropriate navbar for the current route
  if (isLandingPage) {
    return <LandingNavbar />;
  }
  
  return <Navbar />;
}

main
function App() {
  const [chatEnabled] = useState(false);
  const [chatbotWidgetEnabled] = useState(false);
  const [chatbotVoiceEnabled] = useState(false);

  return (
    <ThemeProvider defaultTheme="light" storageKey="theme">
      <ResponsiveProvider>
 newlanding
        <Router>
          <PasswordResetRedirect />
          <AuthProvider>
            <ConditionalNavbar />
            <ErrorBoundary fallback={
              <div className="text-center p-4">
                <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-[#9b87f5] text-white rounded-md hover:bg-[#7E69AB]"
                >
                  Reload Page
                </button>
              </div>
            }>
              <AppRoutes />
=======
        <div className="app-container">
          <MobileStatusBar />
          <Router>
            <PasswordResetRedirect />
            <AuthProvider>
              {/* Using ConditionalNavbar to prevent overlapping */}
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
              
              <MobileNavigation />
 main
              
              <div className="fixed right-6 bottom-6">
                <NotificationBell />
              </div>
              
              <AuthDebugMonitor />
              <Toaster position="top-center" />
            </ErrorBoundary>
          </AuthProvider>
        </Router>
      </ResponsiveProvider>
    </ThemeProvider>
  );
}

export default App;
