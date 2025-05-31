
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
import DoctorProfilePage from '@/pages/DoctorProfilePage';
import PatientPrescriptionsRoute from '@/routes/PatientPrescriptionsRoute';
import VerifyCodePage from '@/pages/VerifyCodePage';
import { ForgotPasswordRouteWrapper } from '@/pages/ForgotPasswordRouteWrapper';
import VideosPage from '@/pages/VideosPage';
import NewPrescriptionPage from '@/pages/NewPrescriptionPage';
import { RegistrationStatusChecker } from '@/components/auth/RegistrationStatusChecker';
import TestingPage from '@/pages/TestingPage';

// Lazy loaded components
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const Admin = lazy(() => import('@/pages/Admin'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const MessageSearchPage = lazy(() => import('@/pages/MessageSearchPage'));
const PatientHabitsPage = lazy(() => import('@/pages/PatientHabitsPage'));
const PatientProfilePage = lazy(() => import('@/pages/PatientProfilePage'));

export const AppRoutes = () => {
  const { userRole } = useAuth();

  // Check if we're in development or staging environment
  const isDevelopment = import.meta.env.DEV || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname.includes('lovable.app') ||
                       window.location.hostname.includes('staging') ||
                       import.meta.env.VITE_ENVIRONMENT !== 'production';

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/auth/login" element={<Auth />} />
        <Route path="/auth/register" element={<Auth />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordRouteWrapper />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        
        {/* Testing Route - Available in development/staging environments */}
        <Route
          path="/testing"
          element={
            <RoleProtectedRoute allowedRoles={['administrator']}>
              <TestingPage />
            </RoleProtectedRoute>
          }
        />
        
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
        
        {/* Patient routes without RegistrationStatusChecker - allow immediate access */}
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
        
        {/* New Prescription Route */}
        <Route
          path="/new-prescription"
          element={
            <ProtectedRoute>
              <NewPrescriptionPage />
            </ProtectedRoute>
          }
        />
        
        {/* Routes for prescriptions - removed RegistrationStatusChecker */}
        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute>
              <PatientPrescriptionsRoute />
            </ProtectedRoute>
          }
        />
        
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

        {/* Doctor Profile Route */}
        <Route
          path="/doctor-profile"
          element={
            <RoleProtectedRoute allowedRoles={['doctor']}>
              <DoctorProfilePage />
            </RoleProtectedRoute>
          }
        />

        {/* Update the user-profile route to handle different roles */}
        <Route
          path="/user-profile"
          element={
            <ProtectedRoute>
              {userRole === 'patient' ? (
                <Navigate to="/patient-profile" replace />
              ) : userRole === 'doctor' ? (
                <Navigate to="/doctor-profile" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )}
            </ProtectedRoute>
          }
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
