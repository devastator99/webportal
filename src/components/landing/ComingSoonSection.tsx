
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BellRing } from "lucide-react";

export const ComingSoonSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/30 overflow-hidden relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full mb-4">
            <BellRing className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Coming Soon</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
            New Mobile App Experience
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            We're launching our mobile app soon! Be the first to know when it's available.
            Get early access and exclusive features by subscribing below.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="bg-white dark:bg-gray-800"
            />
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              Notify Me
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            We'll never share your email with anyone else.
          </p>
        </div>
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl"></div>
    </section>
  );
};
