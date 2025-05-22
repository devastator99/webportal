"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BellRing } from "lucide-react";
export const ComingSoonSection = () => {
  return <section className="bg-gray-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          
          
          
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            
            
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <span className="text-purple-600 font-medium">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile Application</h3>
              <p className="text-gray-500">Access your health dashboard and chat with your care team on the go.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <span className="text-indigo-600 font-medium">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Virtual Consultations</h3>
              <p className="text-gray-500">Connect with your healthcare providers through secure video calls.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 font-medium">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Health Tracking</h3>
              <p className="text-gray-500">Monitor your progress with advanced analytics and personalized insights.</p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};