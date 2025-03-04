
import { lazy, Suspense, useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { useAuth } from "@/contexts/AuthContext";

// Lazy load non-critical components
const Features = lazy(() => import("@/components/Features").then(module => ({ default: module.Features })));
const Testimonials = lazy(() => import("@/components/Testimonials").then(module => ({ default: module.Testimonials })));
const Pricing = lazy(() => import("@/components/Pricing").then(module => ({ default: module.Pricing })));
const Footer = lazy(() => import("@/components/Footer").then(module => ({ default: module.Footer })));
const VideoList = lazy(() => import("@/components/videos/VideoList").then(module => ({ default: module.VideoList })));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9b87f5]"></div>
  </div>
);

export const LandingPage = () => {
  const { isLoading } = useAuth();
  const [isClientSide, setIsClientSide] = useState(false);
  const [authTimeoutExpired, setAuthTimeoutExpired] = useState(false);
  
  // Set a timeout to prevent being stuck in auth loading state forever
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('Auth loading timeout expired, forcing content display');
      setAuthTimeoutExpired(true);
    }, 3000); // 3 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  useEffect(() => {
    // Mark that we're rendering on the client side
    setIsClientSide(true);
    console.log('LandingPage mounted on client side');
  }, []);

  // Don't render anything during SSR or until client-side hydration is complete
  if (!isClientSide) {
    console.log('LandingPage waiting for client-side hydration');
    return <LoadingSpinner />;
  }

  // Show loading spinner only if auth is loading AND the timeout hasn't expired
  if (isLoading && !authTimeoutExpired) {
    console.log('LandingPage is in loading state from auth context');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  // Render the content regardless of auth state after timeout
  console.log('LandingPage rendering full content');
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
