
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";

export default function Index() {
  useEffect(() => {
    console.log("Index page mounted");
  }, []);

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
