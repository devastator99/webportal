import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import BirdVector from './BirdVector';

interface LogoProps {
  className?: string;
  isScrolled?: boolean;
  theme?: 'light' | 'dark';
}

export const Logo = ({ className, isScrolled, theme = 'light' }: LogoProps) => {
  const getTextColor = () => {
    if (theme === 'dark') return 'text-white';
    if (isScrolled) return 'text-gray-900';
    return 'text-white';
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex items-center justify-center w-11 h-11 relative group">
        {/* Animated gradient background with blur */}
        {/* bg-gradient-to-r from-purple-400 to-indigo-400 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-indigo-400 to-purple-700 rounded-full opacity-90 group-hover:opacity-100 transition-all duration-300 blur-[2px] animate-pulse"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full opacity-75 group-hover:opacity-90 transition-all duration-300 blur-xl scale-110"></div>
        
        {/* Main container */}
        <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full shadow-lg backdrop-blur-sm">
          <BirdVector className="w-7 h-7 text-white transform group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>
      
      <span className={cn("font-bold text-lg ml-2", getTextColor())}>
        Anubhooti<span className="text-purple-600">Health</span>
      </span>
    </div>
  );
};