"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
interface OfferingProps {
  title: string;
  image: string;
  description: string;
  features: string[];
}
interface OfferingsSectionProps {
  openAuthModal: (view: 'login' | 'register') => void;
}
const offerings: OfferingProps[] = [{
  title: "Diabetes Care & Reversal",
  image: "https://plus.unsplash.com/premium_photo-1661771843714-fa40c226f43c?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  description: "Comprehensive program targeting the root causes of diabetes for sustainable management and potential reversal.",
  features: ["Personalized nutrition plans", "Continuous glucose monitoring", "AI-powered analysis", "Expert medical supervision"]
}, {
  title: "Weight Care & Management",
  image: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg",
  description: "Science-backed approaches to healthy, sustainable weight management without crash diets or extreme measures.",
  features: ["Metabolic assessment", "Customized diet plans", "Behavioral coaching", "Fitness protocols"]
}, {
  title: "Lifestyle Care",
  image: "https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg",
  description: "Holistic lifestyle interventions addressing sleep, stress, and daily habits for optimal health.",
  features: ["Sleep optimization", "Stress management", "Habit formation", "Mindfulness integration"]
}, {
  title: "PCOD/PCOS Care",
  image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=3072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  description: "Targeted approach to managing hormonal imbalances and reducing PCOS symptoms through lifestyle modifications.",
  features: ["Hormone assessment", "Anti-inflammatory nutrition", "Cycle tracking", "Symptom management"]
}];
export const OfferingCard = ({
  title,
  image,
  description,
  features,
  className
}: OfferingProps & {
  className?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return <motion.div whileHover={{
    scale: 1.03
  }} transition={{
    type: "spring",
    stiffness: 200,
    damping: 15
  }}>
      <Card onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} className={cn("flex flex-col rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg overflow-hidden shadow-lg border border-white/5 group transition-all duration-500", className)}>
        <div className="relative aspect-video overflow-hidden">
          <img src={image} alt={title} className={cn("w-full h-full object-cover transition-transform duration-700", "blur-sm", isHovered ? "blur-none" : "blur-sm")} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <div className="absolute top-4 left-4 flex items-center justify-center bg-white/10 backdrop-blur-md w-12 h-12 rounded-full border border-white/20 shadow-md group-hover:bg-purple-500/30 transition">
            <Sparkles size={18} className="text-white group-hover:text-purple-200" />
          </div>
        </div>

        <CardContent className="p-6 flex-1 relative space-y-4">
          <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition">
            {title}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {description}
          </p>

          <ul className="space-y-3 pt-2">
            {features.map((feature, index) => <li key={index} className="flex items-center text-gray-300 text-sm">
                <span className="h-2 w-2 rounded-full bg-purple-400 mr-3" />
                {feature}
              </li>)}
          </ul>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <div className="flex items-center text-purple-400 hover:text-purple-300 font-medium text-sm cursor-pointer transition">
            <span className="relative">
              Learn more
              <span className="absolute bottom-0 left-0 h-0.5 bg-purple-400 w-0 group-hover:w-full transition-all duration-300" />
            </span>
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardFooter>
      </Card>
    </motion.div>;
};
export const OfferingsSection = ({
  openAuthModal
}: OfferingsSectionProps) => {
  return <section id="offerings" className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black py-[18px]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute top-40 left-20 w-72 h-72 rounded-full bg-purple-900/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-indigo-900/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6" data-animate>
          <motion.span initial={{
          opacity: 0,
          y: 10
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.1
        }} className="inline-block px-4 py-1 bg-purple-900/40 rounded-full text-purple-300 text-sm font-medium backdrop-blur-sm border border-purple-800/30">
            Our Solutions
          </motion.span>

          <motion.h2 initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2
        }} className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Explore Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              Offerings
            </span>
          </motion.h2>

          <motion.p initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3
        }} className="text-xl text-purple-200">
            Take charge of your health today
          </motion.p>

          <motion.p initial={{
          opacity: 0,
          y: 40
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4
        }} className="text-gray-300 text-lg max-w-2xl mx-auto">
            Our comprehensive programs address health conditions at their root, combining cutting-edge technology with personalized care.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-20">
          {offerings.map((offering, index) => <OfferingCard key={index} {...offering} className="h-full" />)}
        </div>

        <div className="text-center" data-animate>
          <motion.div whileHover={{
          scale: 1.05
        }} whileTap={{
          scale: 0.95
        }}>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 
              text-white px-10 py-7 rounded-full text-lg font-medium transition-all duration-300 shadow-lg" size="lg" onClick={() => openAuthModal('register')}>
              Start Your Journey
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>;
};