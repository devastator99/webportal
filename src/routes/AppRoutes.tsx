
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Suspense, lazy } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import DummyPage from "@/pages/DummyPage";
import PatientHabitsPage from "@/pages/PatientHabitsPage";
import PatientPrescriptionsPage from "@/pages/PatientPrescriptionsPage";

// Use a dummy page for missing components
const HomePage = () => <DummyPage title="Home Page" />;
const NotFoundPage = () => <DummyPage title="Not Found" description="The page you are looking for does not exist." />;
const Dashboard = () => <DummyPage title="Dashboard" />;
const AuthPage = () => <DummyPage title="Authentication" />;
const AlternativeDashboard = () => <DummyPage title="Alternative Dashboard" />;
const ChatPage = () => <DummyPage title="Chat" />;
const PatientsPage = () => <DummyPage title="Patients" />;
const AdminPage = () => <DummyPage title="Admin" />;
const PatientDetailPage = () => <DummyPage title="Patient Details" />;
const PatientMedicalRecordsPage = () => <DummyPage title="Patient Medical Records" />;
const PatientAppointmentsPage = () => <DummyPage title="Patient Appointments" />;
const PatientCareTeamPage = () => <DummyPage title="Patient Care Team" />;
const PatientInvoicesPage = () => <DummyPage title="Patient Invoices" />;
const PatientNotesPage = () => <DummyPage title="Patient Notes" />;
const PatientDocumentsPage = () => <DummyPage title="Patient Documents" />;
const PatientLabResultsPage = () => <DummyPage title="Patient Lab Results" />;
const PatientHealthPlanPage = () => <DummyPage title="Patient Health Plan" />;
const PatientPrescriptionsHistoryPage = () => <DummyPage title="Patient Prescriptions History" />;

// Lazy-loaded components (using the dummy page for now)
const VideoLibraryPage = lazy(() => Promise.resolve({ default: () => <DummyPage title="Video Library" /> }));
const SettingsPage = lazy(() => Promise.resolve({ default: () => <DummyPage title="Settings" /> }));
const AppointmentsPage = lazy(() => Promise.resolve({ default: () => <DummyPage title="Appointments" /> }));
const NutritionistDashboardPage = lazy(() => Promise.resolve({ default: () => <DummyPage title="Nutritionist Dashboard" /> }));
const ReceptionDashboardPage = lazy(() => Promise.resolve({ default: () => <DummyPage title="Reception Dashboard" /> }));

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
      <Route 
        path="/patient/prescriptions" 
        element={
          <ProtectedRoute>
            <PatientPrescriptionsPage />
          </ProtectedRoute>
        } 
      />
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
