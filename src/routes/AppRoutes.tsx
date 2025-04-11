import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/AuthPage";
import AlternativeDashboard from "@/pages/AlternativeDashboard";
import ChatPage from "@/pages/ChatPage";
import PatientsPage from "@/pages/PatientsPage";
import PatientPrescriptionsPage from "@/pages/PatientPrescriptionsPage";
import PatientHabitsPage from "@/pages/PatientHabitsPage";
import AdminPage from "@/pages/AdminPage";
import PatientDetailPage from "@/pages/PatientDetailPage";
import PatientMedicalRecordsPage from "@/pages/PatientMedicalRecordsPage";
import PatientAppointmentsPage from "@/pages/PatientAppointmentsPage";
import PatientCareTeamPage from "@/pages/PatientCareTeamPage";
import PatientInvoicesPage from "@/pages/PatientInvoicesPage";
import PatientNotesPage from "@/pages/PatientNotesPage";
import PatientDocumentsPage from "@/pages/PatientDocumentsPage";
import PatientLabResultsPage from "@/pages/PatientLabResultsPage";
import PatientHealthPlanPage from "@/pages/PatientHealthPlanPage";
import PatientPrescriptionsHistoryPage from "@/pages/PatientPrescriptionsHistoryPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import { Suspense, lazy } from "react";
import { Spinner } from "@/components/ui/spinner";

// Lazy-loaded components
const VideoLibraryPage = lazy(() => import("@/pages/VideoLibraryPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AppointmentsPage = lazy(() => import("@/pages/AppointmentsPage"));
const NutritionistDashboardPage = lazy(() => import("@/pages/NutritionistDashboardPage"));
const ReceptionDashboardPage = lazy(() => import("@/pages/ReceptionDashboardPage"));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Spinner size="lg" />
  </div>
);

export function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard-alt" element={<AlternativeDashboard />} />
      <Route path="/patients" element={<PatientsPage />} />
      <Route path="/chat" element={<ChatPage />} />
      
      {/* Patient specific routes */}
      <Route path="/patient/prescriptions" element={<PatientPrescriptionsPage />} />
      <Route path="/patient/habits" element={<PatientHabitsPage />} />
      
      {/* Admin routes */}
      <Route 
        path="/admin" 
        element={
          <RoleProtectedRoute allowedRoles={["administrator"]}>
            <AdminPage />
          </RoleProtectedRoute>
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/appointments" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <AppointmentsPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/videos" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <VideoLibraryPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      {/* Patient detail routes */}
      <Route 
        path="/patients/:patientId" 
        element={
          <RoleProtectedRoute allowedRoles={["doctor", "nutritionist", "administrator", "reception"]}>
            <PatientDetailPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients/:patientId/medical-records" 
        element={
          <RoleProtectedRoute allowedRoles={["doctor", "administrator"]}>
            <PatientMedicalRecordsPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients/:patientId/appointments" 
        element={
          <RoleProtectedRoute allowedRoles={["doctor", "nutritionist", "administrator", "reception"]}>
            <PatientAppointmentsPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients/:patientId/care-team" 
        element={
          <RoleProtectedRoute allowedRoles={["doctor", "administrator"]}>
            <PatientCareTeamPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients/:patientId/invoices" 
        element={
          <RoleProtectedRoute allowedRoles={["administrator", "reception"]}>
            <PatientInvoicesPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients/:patientId/notes" 
        element={
          <RoleProtectedRoute allowedRoles={["doctor", "nutritionist"]}>
            <PatientNotesPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients/:patientId/documents" 
        element={
          <RoleProtectedRoute allowedRoles={["doctor", "administrator"]}>
            <PatientDocumentsPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients/:patientId/lab-results" 
        element={
          <RoleProtectedRoute allowedRoles={["doctor", "administrator"]}>
            <PatientLabResultsPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients/:patientId/health-plan" 
        element={
          <RoleProtectedRoute allowedRoles={["doctor", "nutritionist"]}>
            <PatientHealthPlanPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients/:patientId/prescriptions" 
        element={
          <RoleProtectedRoute allowedRoles={["doctor", "administrator"]}>
            <PatientPrescriptionsHistoryPage />
          </RoleProtectedRoute>
        } 
      />
      
      {/* Role-specific dashboards */}
      <Route 
        path="/nutritionist-dashboard" 
        element={
          <RoleProtectedRoute allowedRoles={["nutritionist"]}>
            <Suspense fallback={<PageLoader />}>
              <NutritionistDashboardPage />
            </Suspense>
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/reception-dashboard" 
        element={
          <RoleProtectedRoute allowedRoles={["reception"]}>
            <Suspense fallback={<PageLoader />}>
              <ReceptionDashboardPage />
            </Suspense>
          </RoleProtectedRoute>
        } 
      />
      
      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
