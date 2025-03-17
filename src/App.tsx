
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

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/dashboard-alt" element={<AlternativeDashboard />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/patients" element={<PatientsView />} />
          </Routes>
          
          {/* Only render the chatbot widget if chat is enabled */}
          {featureFlags.enableChat && featureFlags.enableChatbotWidget && (
            <ChatModule showChatInterface={false} showChatbotWidget={true} />
          )}
          
          <Toaster position="top-right" />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
