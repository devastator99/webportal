
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

const features = [
  {
    icon: <Users className="w-6 h-6 text-[#9b87f5]" />,
    title: "Expert Care Team",
    description: "Connect with specialized healthcare professionals dedicated to your well-being",
  },
  {
    icon: <Calendar className="w-6 h-6 text-[#9b87f5]" />,
    title: "Easy Scheduling",
    description: "Book and manage appointments with just a few clicks",
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-[#9b87f5]" />,
    title: "Instant Communication",
    description: "Direct messaging with your healthcare providers when you need it",
  },
  {
    icon: <Activity className="w-6 h-6 text-[#9b87f5]" />,
    title: "Health Monitoring",
    description: "Track your progress and health metrics in real-time",
  },
  {
    icon: <Shield className="w-6 h-6 text-[#9b87f5]" />,
    title: "Secure Platform",
    description: "Your health data is protected with enterprise-grade security",
  },
  {
    icon: <Clock className="w-6 h-6 text-[#9b87f5]" />,
    title: "24/7 Access",
    description: "Access your health information and care team anytime",
  },
  {
    icon: <Heart className="w-6 h-6 text-[#9b87f5]" />,
    title: "Personalized Care",
    description: "Tailored healthcare plans based on your unique needs",
  },
  {
    icon: <LineChart className="w-6 h-6 text-[#9b87f5]" />,
    title: "Progress Tracking",
    description: "Visual insights into your health journey and improvements",
  },
];

export const NewFeatures = () => {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#7E69AB] mb-12 animate-fade-up">
          Comprehensive Healthcare Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl hover:bg-[#F6F8FD] transition-all duration-300 transform hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 bg-[#E5DEFF] w-12 h-12 rounded-lg flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#7E69AB]">
                {feature.title}
              </h3>
              <p className="text-[#6E59A5]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
