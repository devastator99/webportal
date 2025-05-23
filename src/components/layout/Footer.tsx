
import React from 'react';
import { Logo } from '../ui/Logo';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FooterProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({ openAuthModal }) => {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    if (openAuthModal) {
      openAuthModal('register');
    } else {
      navigate('/auth'); // Fallback if openAuthModal is not provided
    }
  };
  
  return <footer className="relative bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white py-10 overflow-hidden">
      {/* Simplified Background Elements - reduced size */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-purple-600 opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600 opacity-10 rounded-full blur-3xl" />
      
      {/* Glassmorphism container - kept */}
      <div className="glassmorphism-container absolute inset-0 overflow-hidden">
        <div className="glassmorphism-circle opacity-20 bg-gradient-to-br from-purple-400 to-indigo-400 top-1/4 -left-[10%]"></div>
        <div className="glassmorphism-circle opacity-20 bg-gradient-to-br from-blue-400 to-indigo-400 bottom-1/4 -right-[10%]"></div>
      </div>
      
      {/* Condensed Circle Animation */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16">
        <div className="relative w-[200px] h-[200px]">
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute inset-[10px] rounded-full border-2 border-indigo-400/20 animate-[spin_15s_linear_infinite_reverse]"></div>
          <div className="absolute inset-[20px] rounded-full border-2 border-blue-400/30 animate-[spin_25s_linear_infinite]"></div>
        </div>
      </div>
      
      {/* More Compact Call To Action Section */}
      <div className="container mx-auto px-4 relative z-10 max-w-7xl mb-8">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
            Ready to begin your journey towards holistic health?
          </h2>
          <p className="text-base md:text-lg text-indigo-200 mb-6">
            Start transforming your health today with our integrated care approach.
          </p>
          <Button onClick={handleGetStarted} className="bg-white text-indigo-900 hover:bg-indigo-100 font-medium px-6 py-4 rounded-full text-base">
            Get Started
          </Button>
        </div>
      </div>
      
      {/* Footer Content - More compact grid */}
      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-between">
          {/* Contact Us - Reduced vertical spacing */}
          <div className="text-left">
            <h3 className="text-base font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-start space-x-3 text-sm">
                <MapPin size={14} className="text-indigo-300 mt-1 flex-shrink-0" />
                <span className="text-indigo-200">A Unit Of Swami Vivekananda Integrative Health Services Pvt. Ltd.</span>
              </li>
              
              <li className="flex items-center space-x-3 text-sm">
                <Mail size={14} className="text-indigo-300 flex-shrink-0" />
                <a href="mailto:info@anubhootihealth.com" className="text-indigo-200 hover:text-white transition-colors">
                  info@anubhootihealth.com
                </a>
              </li>
              
              <li className="flex items-center space-x-3 text-sm">
                <Phone size={14} className="text-indigo-300 flex-shrink-0" />
                <a href="tel:+919876543210" className="text-indigo-200 hover:text-white transition-colors">
                  +91 987-654-3210
                </a>
              </li>
            </ul>
          </div>
          
          {/* Company Info - Reduced spacing */}
          <div className="space-y-3 md:ml-auto md:text-right">
            <Logo className="text-white md:ml-auto" theme="dark" />
            <p className="text-indigo-200 mt-2 text-sm">
              Integrating traditional wisdom with cutting-edge technology for holistic healthcare solutions.
            </p>
            <div className="flex space-x-3 mt-4 md:justify-end">
              <a href="#" className="text-indigo-200 hover:text-white transition-colors p-1.5 bg-white/10 rounded-full">
                <Facebook size={16} />
              </a>
              <a href="#" className="text-indigo-200 hover:text-white transition-colors p-1.5 bg-white/10 rounded-full">
                <Twitter size={16} />
              </a>
              <a href="#" className="text-indigo-200 hover:text-white transition-colors p-1.5 bg-white/10 rounded-full">
                <Instagram size={16} />
              </a>
              <a href="#" className="text-indigo-200 hover:text-white transition-colors p-1.5 bg-white/10 rounded-full">
                <Linkedin size={16} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-6 pt-4 text-center">
          <p className="text-indigo-200/80 text-xs">© {new Date().getFullYear()} Anubhooti Health. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};
