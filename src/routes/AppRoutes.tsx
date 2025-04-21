
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"; 
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";

// Lazy-loaded pages
const Landing = lazy(() => import("@/pages/LandingPage"));
const Login = lazy(() => import("@/pages/Login"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DoctorDashboard = lazy(() => import("@/pages/doctor/DoctorDashboard"));
const AppointmentBooking = lazy(() => import("@/pages/AppointmentBooking"));
const PatientProfile = lazy(() => import("@/pages/patient/PatientProfile"));
const UploadPage = lazy(() => import("@/pages/patient/UploadPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const RegistrationPage = lazy(() => import("@/pages/RegistrationPage"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const NutritionistDashboard = lazy(() => import("@/pages/nutritionist/NutritionistDashboard"));
const AiChatPage = lazy(() => import("@/pages/AiChatPage"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));
const Prescriptions = lazy(() => import("@/pages/patient/Prescriptions"));
const HabitTracker = lazy(() => import("@/pages/patient/HabitTracker"));
const Providers = lazy(() => import("@/pages/Providers"));
const ProviderProfile = lazy(() => import("@/pages/ProviderProfile"));
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
        return "/chat";
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
            <RoleProtectedRoute allowedRoles={["patient"]}>
              <Prescriptions />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/habits"
          element={
            <RoleProtectedRoute allowedRoles={["patient"]}>
              <HabitTracker />
            </RoleProtectedRoute>
          }
        />

        {/* Default route redirect */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Suspense>
  );
};
