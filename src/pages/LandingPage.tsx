
import { lazy, Suspense } from "react";
import { Hero } from "@/components/Hero";

// Lazy load non-critical components
const Features = lazy(() => import("@/components/Features").then(module => ({ default: module.Features })));
const Testimonials = lazy(() => import("@/components/Testimonials").then(module => ({ default: module.Testimonials })));
const Pricing = lazy(() => import("@/components/Pricing").then(module => ({ default: module.Pricing })));
const Footer = lazy(() => import("@/components/Footer").then(module => ({ default: module.Footer })));
const VideoList = lazy(() => import("@/components/videos/VideoList").then(module => ({ default: module.StandaloneVideoList })));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9b87f5]"></div>
  </div>
);

export const LandingPage = () => {
  // Render content immediately without waiting for auth
  console.log('LandingPage rendering full content immediately');
  
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      
      <Suspense fallback={<LoadingSpinner />}>
        <Features />
      </Suspense>
      
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#7E69AB] mb-12">
          Knowledge Sharing
        </h2>
        <Suspense fallback={<LoadingSpinner />}>
          <VideoList />
        </Suspense>
      </div>
      
      <Suspense fallback={<LoadingSpinner />}>
        <Testimonials />
      </Suspense>
      
      <Suspense fallback={<LoadingSpinner />}>
        <Pricing />
      </Suspense>
      
      <Suspense fallback={<LoadingSpinner />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default LandingPage;
