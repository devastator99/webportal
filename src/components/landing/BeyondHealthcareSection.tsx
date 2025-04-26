
import React from 'react';
import { Pill, Apple, Dumbbell, User } from 'lucide-react';

interface BeyondCardProps {
  icon: React.ReactNode;
  title: string;
  animation?: string;
}

const BeyondCard: React.FC<BeyondCardProps> = ({ icon, title, animation = 'animate-fade-up' }) => (
  <div className={`flex flex-col items-center justify-center p-8 ${animation}`}>
    <div className="mb-6 transform transition-transform duration-500 hover:scale-110">
      {icon}
    </div>
    <h3 className="text-2xl font-semibold text-center">{title}</h3>
  </div>
);

export const BeyondHealthcareSection = () => {
  return (
    <section className="py-20 px-4">
      <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
        Beyond Healthcare
      </h2>
      
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <BeyondCard
            icon={<Pill className="w-16 h-16 text-[#FF9F43]" />}
            title="Beyond Medicine"
            animation="animate-fade-up"
          />
          
          <BeyondCard
            icon={<Apple className="w-16 h-16 text-[#FF6B6B]" />}
            title="Beyond Fad diets"
            animation="animate-fade-up [animation-delay:200ms]"
          />
          
          <BeyondCard
            icon={<Dumbbell className="w-16 h-16 text-[#B088F9]" />}
            title="Beyond Exercise"
            animation="animate-fade-up [animation-delay:400ms]"
          />
          
          <BeyondCard
            icon={<User className="w-16 h-16 text-[#4385F4]" />}
            title="Beyond cookie cutter treatment"
            animation="animate-fade-up [animation-delay:600ms]"
          />
        </div>
      </div>
    </section>
  );
};
