
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import '../styles/landingPage.css';

// Import our new components
import { WixBanner } from "@/components/landing/WixBanner";
import { NewHero } from "@/components/landing/NewHero";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { OfferingsSection } from "@/components/landing/OfferingsSection";
import { JourneySection } from "@/components/landing/JourneySection";

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  
  return (
    <div className="min-h-screen">
      {/* Wix Banner */}
      <WixBanner />
      
      {/* Hero Section */}
      <NewHero />
      
      {/* Benefits Section */}
      <BenefitsSection />
      
      {/* Offerings Section */}
      <OfferingsSection />
      
      {/* Journey Section */}
      <JourneySection />
    </div>
  );
};

export default LandingPage;
