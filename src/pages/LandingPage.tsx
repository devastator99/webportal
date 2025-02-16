
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { VideoList } from "@/components/videos/VideoList";

export const LandingPage = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Features />
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Knowledge Sharing
        </h2>
        <VideoList />
      </div>
      <Testimonials />
      <Pricing />
      <Footer />
    </div>
  );
};
