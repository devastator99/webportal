
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BellRing } from "lucide-react";

export const ComingSoonSection = () => {
  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block p-3 bg-purple-100 rounded-full mb-6">
            <BellRing className="h-8 w-8 text-purple-600" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Coming Soon - Mobile App
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Get early access to our mobile app. Be the first to know when we launch.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-grow"
            />
            <Button className="bg-purple-600 hover:bg-purple-700">
              Notify Me
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
