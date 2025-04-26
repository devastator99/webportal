import {
  Activity,
  Calendar,
  MessageSquare,
  Users,
  Shield,
  Clock,
  Heart,
  LineChart
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: <Users className="w-6 h-6 text-white" />,
    title: "Expert Care Team",
    description: "Connect with specialized healthcare professionals dedicated to your well-being",
  },
  {
    icon: <Calendar className="w-6 h-6 text-white" />,
    title: "Easy Scheduling",
    description: "Book and manage appointments with just a few clicks",
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-white" />,
    title: "Instant Communication",
    description: "Direct messaging with your healthcare providers when you need it",
  },
  {
    icon: <Activity className="w-6 h-6 text-white" />,
    title: "Health Monitoring",
    description: "Track your progress and health metrics in real-time",
  },
  {
    icon: <Shield className="w-6 h-6 text-white" />,
    title: "Secure Platform",
    description: "Your health data is protected with enterprise-grade security",
  },
  {
    icon: <Clock className="w-6 h-6 text-white" />,
    title: "24/7 Access",
    description: "Access your health information and care team anytime",
  },
  {
    icon: <Heart className="w-6 h-6 text-white" />,
    title: "Personalized Care",
    description: "Tailored healthcare plans based on your unique needs",
  },
  {
    icon: <LineChart className="w-6 h-6 text-white" />,
    title: "Progress Tracking",
    description: "Visual insights into your health journey and improvements",
  },
];

export const NewFeatures = () => {
  return (
    <section className="py-20 bg-[#2F3676] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 animate-on-scroll">
          Comprehensive Healthcare Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-[#4A2171]/50 hover:bg-[#4A2171]/70 transition-all duration-300 transform hover:-translate-y-1 animate-on-scroll"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 bg-[#5E35B1] w-12 h-12 rounded-lg flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-white/80">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Beyond Healthcare section */}
      <div className="container mx-auto px-4 mt-20">
        <h2 className="text-4xl font-bold text-center text-white mb-16 animate-on-scroll">
          Beyond Healthcare
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="flex flex-col items-center animate-on-scroll">
            <img 
              src="/lovable-uploads/46f5deea-8449-4a0c-8cc3-4a53a24a7bdb.png" 
              alt="Beyond Medicine" 
              className="w-24 h-24 mb-4 object-contain" 
            />
            <h3 className="text-xl font-semibold text-white text-center">Beyond<br/>Medicine</h3>
          </div>
          <div className="flex flex-col items-center animate-on-scroll" style={{ animationDelay: '100ms' }}>
            <img 
              src="/lovable-uploads/bccd30fa-95fa-4f01-8479-8c069ec6eaa7.png" 
              alt="Beyond Fad diets" 
              className="w-24 h-24 mb-4 object-contain" 
            />
            <h3 className="text-xl font-semibold text-white text-center">Beyond<br/>Fad diets</h3>
          </div>
          <div className="flex flex-col items-center animate-on-scroll" style={{ animationDelay: '200ms' }}>
            <img 
              src="/lovable-uploads/31d1b71a-f157-47c8-ae65-db954af0ca53.png" 
              alt="Beyond Exercise" 
              className="w-24 h-24 mb-4 object-contain" 
            />
            <h3 className="text-xl font-semibold text-white text-center">Beyond<br/>Exercise</h3>
          </div>
          <div className="flex flex-col items-center animate-on-scroll" style={{ animationDelay: '300ms' }}>
            <img 
              src="/lovable-uploads/4db23a12-4300-46fe-a886-2e4515ef7bb4.png" 
              alt="Beyond cookie cutter treatment" 
              className="w-24 h-24 mb-4 object-contain" 
            />
            <h3 className="text-xl font-semibold text-white text-center">Beyond cookie<br/>cutter treatment</h3>
          </div>
        </div>
      </div>

      {/* Explore Our Offerings section */}
      <div className="container mx-auto px-4 mt-8 pb-20">
        <h2 className="text-4xl font-bold text-center text-white mb-4 animate-on-scroll">
          Explore Our Offerings
        </h2>
        <p className="text-xl text-white/80 text-center mb-12 animate-on-scroll">
          Take charge of your health today
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl overflow-hidden animate-on-scroll">
            <div className="bg-black text-white p-4">
              <div className="mb-2">≡</div>
              <h3 className="text-xl font-bold">DIABETES<br/>CARE &<br/>REVERSAL</h3>
            </div>
            <div className="h-48 bg-blue-100 relative">
              <img 
                src="/lovable-uploads/9cc1cd5f-f1fb-4e1b-a58f-aa7018457b02.png" 
                alt="Diabetes Care" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-4 right-4 bg-blue-500 p-1 rounded-full text-white">*</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl overflow-hidden animate-on-scroll" style={{ animationDelay: '100ms' }}>
            <div className="bg-black text-white p-4">
              <div className="mb-2">≡</div>
              <h3 className="text-xl font-bold">WEIGHT<br/>CARE &<br/>MANAGEMENT</h3>
            </div>
            <div className="h-48 bg-blue-100 relative">
              <img 
                src="/lovable-uploads/6a5c1bcd-9f5a-456f-9bba-c9c563562a53.png" 
                alt="Weight Management" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-4 right-4 bg-blue-500 p-1 rounded-full text-white">*</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl overflow-hidden animate-on-scroll" style={{ animationDelay: '200ms' }}>
            <div className="bg-black text-white p-4">
              <div className="mb-2">≡</div>
              <h3 className="text-xl font-bold">LIFESTYLE<br/>CARE</h3>
            </div>
            <div className="h-48 bg-blue-100 relative">
              <img 
                src="/lovable-uploads/6e877813-6f6f-4c80-bf38-13ad712b7d4d.png" 
                alt="Lifestyle Care" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-4 right-4 bg-blue-500 p-1 rounded-full text-white">*</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl overflow-hidden animate-on-scroll" style={{ animationDelay: '300ms' }}>
            <div className="bg-black text-white p-4">
              <div className="mb-2">≡</div>
              <h3 className="text-xl font-bold">PCOD/ PCOS<br/>CARE</h3>
            </div>
            <div className="h-48 bg-blue-100 relative">
              <img 
                src="/lovable-uploads/b80d87fa-ba65-4c3d-b6a1-0ffd8b25fe4d.png" 
                alt="PCOD/PCOS Care" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-4 right-4 bg-blue-500 p-1 rounded-full text-white">*</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-12">
          <Button
            className="bg-black hover:bg-black/90 text-white px-8 py-4 text-lg rounded-full animate-on-scroll"
          >
            Start Now
          </Button>
        </div>
      </div>
    </section>
  );
};
