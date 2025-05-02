"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BellRing } from "lucide-react";

export const ComingSoonSection = () => {
  return (
    <section className="relative py-32 bg-gradient-to-br from-purple-900 via-indigo-900 to-black overflow-hidden">
      {/* Background subtle glowing balls */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[1000px] h-[1000px] bg-purple-700 opacity-20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-700 opacity-20 rounded-full blur-2xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-20">
          
          {/* LEFT TEXT SIDE */}
          <div className="w-full lg:w-1/2 text-center lg:text-left" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Something <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Amazing</span> Is Coming Soon
            </h2>
            <p className="text-lg md:text-xl text-purple-200 mb-8">
              Be among the first to experience the future of personalized health care.
            </p>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl mb-8 shadow-md max-w-md mx-auto lg:mx-0">
              <p className="text-white/80 mb-4 text-sm">
                Enter your email to get early access & premium features.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="email"
                  placeholder="Your Email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white">
                  <BellRing className="mr-2 h-4 w-4" />
                  Notify Me
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {["AI Powered", "Progress Tracking", "Expert Chat", "Daily Health Tips"].map((feature, i) => (
                <div
                  key={i}
                  className="px-4 py-2 rounded-full bg-white/10 text-white text-sm backdrop-blur-sm"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT IMAGE SIDE */}
          <div className="w-full lg:w-1/2 relative flex justify-center" data-animate>
            <div className="relative flex items-center gap-6">
              <img
                src="/lovable-uploads/1e457888-1ca5-4a77-a065-fe7b4765fe5a.png"
                alt="App Preview 1"
                className="w-40 md:w-52 rounded-2xl shadow-xl object-cover animate-float"
              />
              <img
                src="/lovable-uploads/e42732ca-e658-4992-8a2d-863555e56873.png"
                alt="App Preview 2"
                className="w-40 md:w-52 rounded-2xl shadow-xl object-cover animate-float-slow"
                style={{ animationDelay: "1s" }}
              />
            </div>

            {/* Floating stat badges */}
            <div className="absolute -top-10 right-10 bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-lg animate-float-slow" style={{ animationDelay: "2s" }}>
              <div className="text-xs text-white font-medium">Steps Today</div>
              <div className="text-2xl text-white font-bold">8,546</div>
            </div>
            <div className="absolute bottom-10 left-10 bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-lg animate-float" style={{ animationDelay: "3s" }}>
              <div className="text-xs text-white font-medium">Blood Sugar</div>
              <div className="text-2xl text-white font-bold">Normal</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
