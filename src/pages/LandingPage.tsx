import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/NewHero';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { OfferingsSection } from '@/components/landing/OfferingsSection';
import { JourneySection } from '@/components/landing/JourneySection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ComingSoonSection } from '@/components/landing/ComingSoonSection';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { useBreakpoint } from '@/hooks/use-responsive-layout';
import '../styles/landingPage.css';

export const LandingPage = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const mainRef = useRef<HTMLDivElement>(null);
  
  // Parse URL search params to detect if we should open auth modal
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const authParam = searchParams.get('auth');
    
    if (authParam === 'login') {
      setAuthModalView('login');
      setIsAuthModalOpen(true);
    } else if (authParam === 'register') {
      setAuthModalView('register');
      setIsAuthModalOpen(true);
    }
    
    // Clean up the URL after processing parameters
    if (authParam) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location]);
  
  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);
  
  // Intersection Observer for animated elements
  useEffect(() => {
    if (!mainRef.current) return;
    
    const animatedElements = mainRef.current.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
      observer.observe(element);
    });
    
    return () => {
      animatedElements.forEach(element => {
        observer.unobserve(element);
      });
    };
  }, []);
  
  // Open auth modal with specific view
  const openAuthModal = (view: 'login' | 'register') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };
  
  return (
    <div className="w-full flex flex-col min-h-screen overflow-x-hidden">
      <Header openAuthModal={openAuthModal} />
      <main ref={mainRef} className="flex-grow pt-16 md:pt-20">
        <HeroSection openAuthModal={openAuthModal} />
        
        <div className="mt-0">
          <ResponsiveContainer withPadding={false}>
            <BenefitsSection />
          </ResponsiveContainer>
        </div>
        
        <div className="mt-0">
          <ResponsiveContainer withPadding={false}>
            <OfferingsSection openAuthModal={openAuthModal} />
          </ResponsiveContainer>
        </div>
        
        <div className="mt-0">
          <ComingSoonSection />
        </div>
        
        <div className="mt-0">
          <JourneySection openAuthModal={openAuthModal} />
        </div>
        
        <div className="mt-0">
          <TestimonialsSection />
        </div>
      </main>
      <Footer />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authModalView} 
      />
    </div>
  );
};
