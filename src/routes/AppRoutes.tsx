
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import Auth from '@/pages/Auth';
import UpdatePassword from '@/pages/UpdatePassword';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import PatientDetailsPage from '@/pages/PatientDetailsPage';
import PatientsView from '@/pages/PatientsView';
import Dashboard from '@/pages/Dashboard';
import PatientPrescriptionsRoute from '@/routes/PatientPrescriptionsRoute';
import VerifyCodePage from '@/pages/VerifyCodePage';
import { ForgotPasswordRouteWrapper } from '@/pages/ForgotPasswordRouteWrapper';

// Lazy loaded components
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const Admin = lazy(() => import('@/pages/Admin'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const MessageSearchPage = lazy(() => import('@/pages/MessageSearchPage'));
const PatientHabitsPage = lazy(() => import('@/pages/PatientHabitsPage'));
const PatientPrescriptionsPage = lazy(() => import('@/pages/PatientPrescriptionsPage'));
const PatientProfilePage = lazy(() => import('@/pages/PatientProfilePage'));
const VideosPage = lazy(() => import('@/pages/VideosPage'));

export const AppRoutes = () => {
  const { userRole } = useAuth();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordRouteWrapper />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Handle redirect from "/doctor-dashboard" to "/dashboard" */}
        <Route
          path="/doctor-dashboard"
          element={<Navigate to="/dashboard" replace />}
        />
        
        {/* Other routes */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/patients"
          element={
            <RoleProtectedRoute allowedRoles={['doctor', 'administrator']}>
              <PatientsView />
            </RoleProtectedRoute>
          }
        />
        
        <Route
          path="/patient/:patientId"
          element={
            <RoleProtectedRoute allowedRoles={['doctor', 'administrator']}>
              <PatientDetailsPage />
            </RoleProtectedRoute>
          }
        />
        
        <Route
          path="/admin/*"
          element={
            <RoleProtectedRoute allowedRoles={['administrator']}>
              <Admin />
            </RoleProtectedRoute>
          }
        />
        
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessageSearchPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/patient-habits"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <PatientHabitsPage />
            </RoleProtectedRoute>
          }
        />
        
        <Route
          path="/videos"
          element={
            <ProtectedRoute>
              <VideosPage />
            </ProtectedRoute>
          }
        />
        
        {/* Updated route to allow both doctors and patients to view prescriptions */}
        <Route
          path="/prescriptions/:patientId"
          element={
            <ProtectedRoute>
              <PatientPrescriptionsRoute />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/patient-profile"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <PatientProfilePage />
            </RoleProtectedRoute>
          }
        />

        {/* Add a temporary route handler for non-patient profiles */}
        <Route
          path="/user-profile"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
