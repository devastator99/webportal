import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Logo } from '../ui/Logo';
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // Track scroll position to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3",
        isScrolled 
          ? "bg-white/70 backdrop-blur-sm shadow-sm" 
          : "bg-#6b46c1-400"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Logo isScrolled={isScrolled} />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#benefits" 
              className={cn(
                "text-sm font-medium hover:text-purple-600 transition-colors",
                isScrolled ? "text-gray-800" : "text-white"
              )}
            >
              Benefits
            </a>
            <a 
              href="#testimonials" 
              className={cn(
                "text-sm font-medium hover:text-purple-600 transition-colors",
                isScrolled ? "text-gray-800" : "text-white"
              )}
            >
              Testimonials
            </a>
            <a 
              href="#offerings" 
              className={cn(
                "text-sm font-medium hover:text-purple-600 transition-colors",
                isScrolled ? "text-gray-800" : "text-white"
              )}
            >
              Services
            </a>
            <a 
              href="#journey" 
              className={cn(
                "text-sm font-medium hover:text-purple-600 transition-colors",
                isScrolled ? "text-gray-800" : "text-white"
              )}
            >
              Journey
            </a>
            <Button 
              size="sm" 
              variant={isScrolled ? "default" : "outline"}
              className={cn(
                "ml-4 transition-shadow duration-300 relative group",
                isScrolled 
                  ? "bg-purple-600 text-white hover:bg-purple-700" 
                  : "bg-purple-500 text-white border-white hover:bg-white/20 hover:text-white shadow-lg glow-effect"
              )}
              onClick={() => navigate("/auth")}
            >
              Start Today
            </Button>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
              <X className={cn(
                "h-6 w-6 transition-colors",
                isScrolled ? "text-gray-800" : "text-white"
              )} />
            ) : (
              <Menu className={cn(
                "h-6 w-6 transition-colors",
                isScrolled ? "text-gray-800" : "text-white"
              )} />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg animate-fade-in">
          <nav className="container mx-auto px-4 py-6 flex flex-col space-y-4">
            <a 
              href="#benefits" 
              className="text-gray-800 hover:text-purple-600 transition-colors py-2 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Benefits
            </a>
            <a 
              href="#testimonials" 
              className="text-gray-800 hover:text-purple-600 transition-colors py-2 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Testimonials
            </a>
            <a 
              href="#offerings" 
              className="text-gray-800 hover:text-purple-600 transition-colors py-2 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Services
            </a>
            <a 
              href="#journey" 
              className="text-gray-800 hover:text-purple-600 transition-colors py-2 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Journey
            </a>
            <Button className="w-full mt-4" onClick={() => navigate("/auth")}>
              Start Today
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};