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
      
      {/* Rotating Circle Animation */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20">
        <div className="relative w-[300px] h-[300px]">
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute inset-[15px] rounded-full border-2 border-indigo-400/20 animate-[spin_15s_linear_infinite_reverse]"></div>
          <div className="absolute inset-[30px] rounded-full border-2 border-blue-400/30 animate-[spin_25s_linear_infinite]"></div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
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
                <Phone size={16} className="text-indigo-300 flex-shrink-0" />
                <a href="tel:+1234567890" className="text-indigo-200 hover:text-white transition-colors">
                  +1 (234) 567-890
                </a>
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
          <div>
            <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">Newsletter</h3>
            <p className="text-indigo-200 mb-4 text-sm">
              Subscribe to our newsletter for the latest updates and health tips.
            </p>
            <div className="flex flex-col space-y-2">
              <div className="relative">
                <Input type="email" placeholder="Your email address" className="bg-white/10 border-white/20 text-white placeholder:text-indigo-200/70 pr-12" />
                <Button className="absolute right-0 inset-y-0 px-3 bg-transparent hover:bg-transparent">
                  <ArrowRight size={18} className="text-indigo-300" />
                </Button>
              </div>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6 animate-[spin_20s_linear_infinite]">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-400/30"></div>
            <div className="absolute inset-[15%] flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full">
              <span className="text-xs font-medium">COMING<br />SOON</span>
            </div>
          </div>
          <p className="text-indigo-200/80 text-sm">© {new Date().getFullYear()} Anubhooti Health. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};