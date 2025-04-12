
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AlternativeDashboard from './pages/AlternativeDashboard';
import Admin from './pages/Admin';
import PatientsView from './pages/PatientsView';
import ChatPage from './pages/ChatPage';
import { featureFlags } from './config/features';
import { ChatModule } from './modules/chat/ChatModule';
import React, { useEffect, useState } from 'react';
import { MobileStatusBar } from './components/mobile/MobileStatusBar';
import { MobileNavigation } from './components/mobile/MobileNavigation';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute';

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
      <div className="app-container">
        <MobileStatusBar />
        <Router>
          <AuthProvider>
            {/* Move Navbar here to ensure it's available on all routes */}
            <Navbar />
            <div className="mobile-content">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected routes that require authentication */}
                  <Route path="/dashboard/*" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard-alt" element={
                    <ProtectedRoute>
                      <AlternativeDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Role-protected routes */}
                  <Route path="/admin/*" element={
                    <RoleProtectedRoute allowedRoles={["administrator"]}>
                      <Admin />
                    </RoleProtectedRoute>
                  } />
                  <Route path="/patients" element={
                    <RoleProtectedRoute allowedRoles={["doctor", "nutritionist", "administrator", "reception"]}>
                      <PatientsView />
                    </RoleProtectedRoute>
                  } />
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  } />
                </Routes>
              </ErrorBoundary>
            </div>
            
            <MobileNavigation />
            
            {/* Only render the chatbot widget as a chat link button */}
            {chatEnabled && chatbotWidgetEnabled && (
              <div className="fixed right-6 bottom-6 z-40">
                <ChatModule showChatInterface={false} showChatbotWidget={true} />
              </div>
            )}
            
            <Toaster position="top-center" />
          </AuthProvider>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
