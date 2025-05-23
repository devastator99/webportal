import React from 'react';
import { Logo } from '../ui/Logo';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
export const Footer = () => {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    navigate('/auth'); // Navigate to auth page when button is clicked
  };
  return <footer className="relative bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white py-16 overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] bg-purple-600 opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600 opacity-10 rounded-full blur-3xl" />
      
      {/* Glassmorphism container */}
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
      
      {/* Call To Action Section - Merged into the top of footer */}
      <div className="container mx-auto px-4 relative z-10 max-w-7xl mb-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
            Ready to begin your journey towards holistic health?
          </h2>
          <p className="text-lg md:text-xl text-indigo-200 mb-8">
            Start transforming your health today with our integrated care approach that combines modern medicine and traditional wisdom.
          </p>
          <Button onClick={handleGetStarted} className="bg-white text-indigo-900 hover:bg-indigo-100 font-medium px-8 py-6 rounded-full text-lg">
            Get Started
          </Button>
        </div>
        
        
      </div>
      
      {/* Footer Content */}
      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-between">
          {/* Contact Us */}
          <div className="text-left">
            <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm">
                <MapPin size={16} className="text-indigo-300 mt-1 flex-shrink-0" />
                <span className="text-indigo-200">A Unit Of Swami Vivekananda Integrative Health Services Pvt. Ltd.</span>
              </li>
              
              <li className="flex items-center space-x-3 text-sm">
                <Mail size={16} className="text-indigo-300 flex-shrink-0" />
                <a href="mailto:info@anubhootihealth.com" className="text-indigo-200 hover:text-white transition-colors">
                  info@anubhootihealth.com
                </a>
              </li>
              
              <li className="flex items-center space-x-3 text-sm">
                <Phone size={16} className="text-indigo-300 flex-shrink-0" />
                <a href="tel:+919876543210" className="text-indigo-200 hover:text-white transition-colors">
                  +91 987-654-3210
                </a>
              </li>
            </ul>
          </div>
          
          {/* Company Info */}
          <div className="space-y-4 md:ml-auto md:text-right">
            <Logo className="text-white md:ml-auto" theme="dark" />
            <p className="text-indigo-200 mt-4 text-sm">
              Integrating traditional wisdom with cutting-edge technology for holistic healthcare solutions.
            </p>
            <div className="flex space-x-4 mt-6 md:justify-end">
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
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-indigo-200/80 text-sm">© {new Date().getFullYear()} Anubhooti Health. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};