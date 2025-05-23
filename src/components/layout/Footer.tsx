import React from 'react';
import { Logo } from '../ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
export const Footer = () => {
  return <footer className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white py-16 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] bg-purple-700 opacity-20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-700 opacity-20 rounded-full blur-2xl" />
      
      {/* Glassmorphism container from CallToAction component */}
      <div className="glassmorphism-container absolute inset-0 overflow-hidden">
        <div className="glassmorphism-circle opacity-20 bg-gradient-to-br from-purple-400 to-indigo-400 top-1/4 -left-[10%]"></div>
        <div className="glassmorphism-circle opacity-20 bg-gradient-to-br from-blue-400 to-indigo-400 bottom-1/4 -right-[10%]"></div>
      </div>
      
      {/* Rotating Circle Animation */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20">
        <div className="relative w-[300px] h-[300px]">
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute inset-[15px] rounded-full border-2 border-indigo-400/20 animate-[spin_15s_linear_infinite_reverse]"></div>
          <div className="absolute inset-[30px] rounded-full border-2 border-blue-400/30 animate-[spin_25s_linear_infinite]"></div>
        </div>
      </div>
      
      {/* Container from CallToAction.tsx */}
      <div className="container mx-auto px-4 relative z-10">
        {/* Added the selected div from CallToAction.tsx */}
        
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Logo className="text-white" theme="dark" />
            <p className="text-indigo-200 mt-4 text-sm">
              Integrating traditional wisdom with cutting-edge technology for holistic healthcare solutions.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-indigo-200 hover:text-white transition-colors p-2 bg-white/10 rounded-full">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-indigo-200 hover:text-white transition-colors p-2 bg-white/10 rounded-full">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-indigo-200 hover:text-white transition-colors p-2 bg-white/10 rounded-full">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-indigo-200 hover:text-white transition-colors p-2 bg-white/10 rounded-full">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          
          
          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm">
                <MapPin size={16} className="text-indigo-300 mt-1 flex-shrink-0" />
                <span className="text-indigo-200">A Unit Of Swami Vivekananda
Integrative Health Services Pvt. Ltd.</span>
              </li>
              
              <li className="flex items-center space-x-3 text-sm">
                <Mail size={16} className="text-indigo-300 flex-shrink-0" />
                <a href="mailto:info@anubhootihealth.com" className="text-indigo-200 hover:text-white transition-colors">
                  info@anubhootihealth.com
                </a>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 text-center my-[8px] py-0">
          
          <p className="text-indigo-200/80 text-sm">© {new Date().getFullYear()} Anubhooti Health. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};