
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
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 animate-fade-up">
          Comprehensive Healthcare Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-[#4A2171]/50 hover:bg-[#4A2171]/70 transition-all duration-300 transform hover:-translate-y-1 animate-fade-up"
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
    </section>
  );
};
