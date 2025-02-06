import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function Index() {
  const { user, isLoading, isInitialized } = useAuth();

  useEffect(() => {
    console.log("Index component mounted, auth state:", { user, isLoading, isInitialized });
  }, [user, isLoading, isInitialized]);

  // Don't render anything until we're initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  );
}