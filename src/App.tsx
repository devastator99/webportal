
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import CompleteDoctorProfile from "./pages/CompleteDoctorProfile";
import CompleteNutritionistProfile from "./pages/CompleteNutritionistProfile";
import Chat from "./pages/Chat";
import { Prescriptions } from "./pages/Prescriptions";
import { Appointments } from "./pages/Appointments";
import { NotificationManager } from "@/components/notifications/NotificationManager";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NotificationManager />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth/*" element={<Auth />} />
              <Route path="/complete-doctor-profile" element={<CompleteDoctorProfile />} />
              <Route path="/complete-nutritionist-profile" element={<CompleteNutritionistProfile />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
              <Route path="/appointments" element={<Appointments />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
