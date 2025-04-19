import { lazy, Suspense } from 'react';
import { Route, Routes, Outlet, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import Dashboard from '../pages/Dashboard';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '../components/auth/RoleProtectedRoute';
import ChatPage from '@/pages/ChatPage';
import Auth from '@/pages/Auth';
import PatientsView from '@/pages/PatientsView';
import PatientHabitsPage from '@/pages/PatientHabitsPage';
import PatientPrescriptionsPage from '@/pages/PatientPrescriptionsPage';
import Admin from '@/pages/Admin';
import MessageSearchPage from '@/pages/MessageSearchPage';
import DummyPage from '@/pages/DummyPage';
import AlternativeDashboard from '@/pages/AlternativeDashboard';

// Lazy load the notifications page
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth routes with comprehensive support for password reset paths */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/reset" element={<Auth />} />
        <Route path="/auth/recovery" element={<Auth />} />
        <Route path="/auth/update-password" element={<Auth />} />
        
        {/* Support for various URL formats that might be used in links */}
        <Route path="/verification" element={<Navigate to="/auth/update-password" replace />} />
        <Route path="/auth/callback" element={<Navigate to="/auth/update-password" replace />} />
        <Route path="/reset-password" element={<Navigate to="/auth/update-password" replace />} />
        
        <Route 
          path="/dummy" 
          element={<DummyPage title="Dummy Page" description="This is a placeholder page" />} 
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alt-dashboard" element={<AlternativeDashboard />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/habits" element={<PatientHabitsPage />} />
          <Route path="/prescriptions" element={<PatientPrescriptionsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messages/search" element={<MessageSearchPage />} />
        </Route>

        {/* Role-specific routes */}
        <Route 
          element={
            <RoleProtectedRoute allowedRoles={['doctor', 'administrator']}>
              <Outlet />
            </RoleProtectedRoute>
          }
        >
          <Route path="/patients" element={<PatientsView />} />
        </Route>

        <Route 
          element={
            <RoleProtectedRoute allowedRoles={['administrator']}>
              <Outlet />
            </RoleProtectedRoute>
          }
        >
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
