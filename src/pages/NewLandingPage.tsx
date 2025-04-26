
import { useEffect } from "react";
import { NewHero } from "@/components/landing/NewHero";
import { NewFeatures } from "@/components/landing/NewFeatures";
import { NewSolutions } from "@/components/landing/NewSolutions";
import { NewTestimonials } from "@/components/landing/NewTestimonials";
import { NewFooter } from "@/components/landing/NewFooter";

const NewLandingPage = () => {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
    
    // Add animate-on-scroll functionality
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
    
    return () => {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#4A2171] overflow-hidden">
      {/* Custom cursor or other global elements could go here */}
      <NewHero />
      <NewFeatures />
      <NewSolutions />
      <NewTestimonials />
      <NewFooter />
    </div>
  );
};

export default NewLandingPage;
