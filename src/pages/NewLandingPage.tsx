
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
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <NewHero />
      <NewFeatures />
      <NewSolutions />
      <NewTestimonials />
      <NewFooter />
    </div>
  );
};

export default NewLandingPage;
