
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LandingPage } from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import CompleteDoctorProfile from "./pages/CompleteDoctorProfile";
import CompleteNutritionistProfile from "./pages/CompleteNutritionistProfile";
import Chat from "./pages/ChatPage";
import PatientPrescriptionsView from "./pages/PatientPrescriptionsView";
import { Appointments } from "./pages/Appointments";
import TestingPage from "./pages/TestingPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth/*" element={<Auth />} />
              <Route path="/complete-doctor-profile" element={<CompleteDoctorProfile />} />
              <Route path="/complete-nutritionist-profile" element={<CompleteNutritionistProfile />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/prescriptions" element={<PatientPrescriptionsView />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/testing" element={<TestingPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
