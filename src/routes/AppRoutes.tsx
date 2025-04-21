import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"; 
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";

// Lazy-loaded pages
const Landing = lazy(() => import("@/pages/LandingPage"));
// Using Auth instead of Login as it might be the correct page
const Login = lazy(() => import("@/pages/Auth"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const AuthCallback = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DoctorDashboard = lazy(() => import("@/pages/Dashboard")); // Fallback to Dashboard
const AppointmentBooking = lazy(() => import("@/pages/Dashboard")); // Fallback to Dashboard 
const PatientProfile = lazy(() => import("@/pages/Dashboard")); // Fallback to Dashboard
const UploadPage = lazy(() => import("@/pages/Dashboard")); // Fallback to Dashboard
const RegistrationPage = lazy(() => import("@/pages/Auth")); // Use Auth page
const VerifyEmail = lazy(() => import("@/pages/Auth")); // Use Auth page
// const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage")); // This file doesn't exist
// Use Auth page for reset password as well
const ResetPasswordPage = lazy(() => import("@/pages/Auth")); 
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword"));
const AdminDashboard = lazy(() => import("@/pages/Dashboard")); // Fallback to Dashboard
const NutritionistDashboard = lazy(() => import("@/pages/Dashboard")); // Fallback to Dashboard
const AiChatPage = lazy(() => import("@/pages/ChatPage")); // Use the ChatPage as a fallback
const FAQPage = lazy(() => import("@/pages/LandingPage")); // Use LandingPage as fallback
const Prescriptions = lazy(() => import("@/pages/PatientPrescriptionsPage")); // Update to use correct page
const HabitTracker = lazy(() => import("@/pages/PatientHabitsPage")); // Update to use correct page
const Providers = lazy(() => import("@/pages/LandingPage")); // Use LandingPage as fallback
const ProviderProfile = lazy(() => import("@/pages/LandingPage")); // Use LandingPage as fallback
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));

const LoadingFallback = () => (
  <div className="h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export const AppRoutes = () => {
  const { userRole } = useAuth();

  // Determine the default route based on user role
  const getDefaultRoute = () => {
    switch (userRole) {
      case "patient":
        return "/chat"; // Ensure patients go to chat screen by default
      case "doctor":
        return "/doctor-dashboard";
      case "administrator":
        return "/admin";
      case "nutritionist":
        return "/nutritionist-dashboard";
      default:
        return "/";
    }
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/auth" element={<AuthCallback />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/provider/:id" element={<ProviderProfile />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-chat"
          element={
            <ProtectedRoute>
              <AiChatPage />
            </ProtectedRoute>
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
          path="/doctor-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/nutritionist-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["nutritionist"]}>
              <NutritionistDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={["administrator"]}>
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <RoleProtectedRoute allowedRoles={["patient"]}>
              <AppointmentBooking />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <RoleProtectedRoute allowedRoles={["patient"]}>
              <PatientProfile />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/uploads"
          element={
            <RoleProtectedRoute allowedRoles={["patient"]}>
              <UploadPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute>
              <Prescriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/habits"
          element={
            <ProtectedRoute>
              <HabitTracker />
            </ProtectedRoute>
          }
        />

        {/* Default route redirect */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Suspense>
  );
};
