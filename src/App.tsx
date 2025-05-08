import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { LandingPage } from "./pages/LandingPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ChatPage } from "./pages/ChatPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { GuestRoute } from "./components/auth/GuestRoute";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { TermsOfServicePage } from "./pages/TermsOfServicePage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { ContactPage } from "./pages/ContactPage";
import { AboutUsPage } from "./pages/AboutUsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { useIsMobile } from "./hooks/use-mobile";
import { MobileNavigation } from "./components/mobile/MobileNavigation";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SiteFooter } from "./components/layout/SiteFooter";
import { ScrollToTop } from "./components/utils/ScrollToTop";
import { AppLayout } from "./layouts/AppLayout";
import { PatientAppLayout } from "./layouts/PatientAppLayout";
import { DoctorDashboard } from "./components/dashboard/doctor/DoctorDashboard";
import { NutritionistDashboard } from "./components/dashboard/nutritionist/NutritionistDashboard";
import { PatientDashboard } from "./components/dashboard/patient/PatientDashboard";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { useAuth } from "./contexts/AuthContext";
import { UserRoleEnum } from "./contexts/AuthContext";

import "./styles/globals.css";
import "./styles/chat-header.css"; // Add this import

function AppRouter() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (user && location.pathname === "/") {
      switch (userRole) {
        case UserRoleEnum.PATIENT:
          return;
        case UserRoleEnum.DOCTOR:
          return;
        case UserRoleEnum.NUTRITIONIST:
          return;
        default:
          toast({
            title: "Error",
            description: "No user role assigned",
            variant: "destructive",
          });
          break;
      }
    }
  }, [user, userRole, isLoading, location, toast]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<GuestRoute><SignInPage /></GuestRoute>} />
        <Route path="/sign-up" element={<GuestRoute><SignUpPage /></GuestRoute>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <DashboardPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientDashboard />} />
          <Route path="doctor" element={<DoctorDashboard />} />
          <Route path="nutritionist" element={<NutritionistDashboard />} />
          <Route path="patient" element={<PatientDashboard />} />
        </Route>

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
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

        {/* Not Found Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {isMobile && <MobileNavigation />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
