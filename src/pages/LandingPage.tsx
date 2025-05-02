
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/NewHero';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { OfferingsSection } from '@/components/landing/OfferingsSection';
import { JourneySection } from '@/components/landing/JourneySection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ComingSoonSection } from '@/components/landing/ComingSoonSection';
import { CallToAction } from '@/components/landing/CallToAction';
import '../styles/landingPage.css';

export const LandingPage = () => {
  // Intersection Observer for animated elements
  useEffect(() => {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
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
  
  return (
    <div className="w-full flex flex-col">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <BenefitsSection />
        <TestimonialsSection />
        <OfferingsSection />
        <ComingSoonSection />
        <JourneySection />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};
