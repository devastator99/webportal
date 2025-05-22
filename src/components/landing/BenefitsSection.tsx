
"use client";

import { Check } from "lucide-react";
import { Card } from "../ui/card";
import { useResponsive } from "@/contexts/ResponsiveContext";

export const BenefitsSection = () => {
  const { isMobile } = useResponsive();
  
  const benefits = [
    {
      icon: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?q=80&w=2596&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: "Beyond Medicine",
      description: "Root-cause-focused programs blending ancient wisdom with science.",
    },
    {
      icon: "https://plus.unsplash.com/premium_photo-1683657860843-abae8aa03a64?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: "Beyond Fad Diets",
      description: "Tailored nutrition blueprints, crafted for your unique biochemistry.",
    },
    {
      icon: "https://plus.unsplash.com/premium_photo-1679938885972-180ed418f466?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: "Beyond Exercise",
      description: "Mindful, customized movement strategies to awaken true vitality.",
    },
    {
      icon: "https://plus.unsplash.com/premium_photo-1695119995113-56aa2159c761?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: "Beyond Cookie Cutter",
      description: "Hyper-personalized health journeys powered by AI and expert care.",
    },
  ];

  return (
    <section id="benefits" className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-b from-white via-purple-50/20 to-white">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 md:mb-20 space-y-4 sm:space-y-6 px-4" data-animate>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            How AnubhootiHealth Helps You Thrive
          </h2>
          <p className="text-lg sm:text-xl text-purple-700 font-medium">
            See measurable health transformation in just 15 days.
          </p>
          <p className="text-gray-600 text-base sm:text-lg">
            A full-spectrum wellness platform — combining AI brilliance with compassionate expert guidance to help you live disease-free, sustainably.
          </p>
        </div>

        {/* BENEFITS CARDS - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 mb-16 sm:mb-20 md:mb-24">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="group bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col"
              data-animate
            >
              {/* Full width image with better aspect ratio control */}
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={benefit.icon}
                  alt={benefit.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Text content */}
              <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 text-center">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-purple-700 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>

              {/* Hover underline */}
              <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </Card>
          ))}
        </div>

        {/* SCIENCE BACKED SECTION */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-16 shadow-xl flex flex-col md:flex-row items-center gap-8 sm:gap-12 md:gap-16" data-animate>
          
          {/* LEFT TEXT */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Our Science-Backed Approach
            </h3>
            <p className="text-gray-600 text-base sm:text-lg">
              Anubhooti Health's philosophy is to combine ancestral wisdom with modern evidence-based protocols. We attack root causes — not just symptoms — for true, lasting vitality.
            </p>

            <ul className="space-y-3 sm:space-y-4">
              {[
                "Custom health protocols curated by doctors + AI",
                "Continuous health monitoring via smart analytics",
                "Precision-driven nutrition, movement, and stress care",
                "Empathetic coaching that evolves with you",
              ].map((point, i) => (
                <li key={i} className="flex items-start">
                  <span className="bg-green-100 p-1 rounded-full mr-3 mt-1">
                    <Check size={isMobile ? 16 : 18} className="text-green-600" />
                  </span>
                  <span className="text-gray-700 text-sm sm:text-base">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT IMAGE */}
          <div className="flex-1 relative w-full md:w-auto">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl animate-float">
              <img
                src="https://plus.unsplash.com/premium_photo-1676325102269-35142789c6b2?q=80&w=2942&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Science-backed Care"
                className="w-full object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent rounded-2xl" />
              <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 text-white">
                <div className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">Clinical Innovation</div>
                <div className="text-lg sm:text-2xl font-bold">Precision Health AI</div>
              </div>
            </div>

            {/* Floating stat badge */}
            <div className="absolute -top-3 -right-3 sm:-top-6 sm:-right-6 bg-white p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-lg animate-float-slow">
              <div className="text-xs text-gray-400">Success Rate</div>
              <div className="text-xl sm:text-2xl font-bold text-purple-700">92%</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
