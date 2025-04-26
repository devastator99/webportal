
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const solutions = [
  {
    title: "Virtual Consultations",
    description: "Connect with healthcare professionals from anywhere, anytime",
    color: "from-[#FFE29F] to-[#FF719A]",
    image: "/lovable-uploads/b80d87fa-ba65-4c3d-b6a1-0ffd8b25fe4d.png"
  },
  {
    title: "Health Monitoring",
    description: "Track your vitals and health progress in real-time",
    color: "from-[#FEC6A1] to-[#FE9B9B]",
    image: "/lovable-uploads/119d31f1-4c83-43b2-bdbb-60cbb2662f70.png"
  },
  {
    title: "Care Team Collaboration",
    description: "Seamless communication between all your healthcare providers",
    color: "from-[#D3E4FD] to-[#A7C5F9]",
    image: "/lovable-uploads/8ebb983a-c315-4e12-8248-c83c2f25bfe9.png"
  },
];

export const NewSolutions = () => {
  return (
    <section className="py-20 px-4 md:px-6 bg-[#4A2171] relative overflow-hidden">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 animate-on-scroll">
          Comprehensive Healthcare Solutions
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-[#2F3676]/50 hover:bg-[#2F3676] transition-all duration-300 transform hover:-translate-y-1 animate-on-scroll group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div 
                className={`h-48 mb-6 rounded-lg bg-gradient-to-r ${solution.color} group-hover:scale-105 transition-transform duration-300`}
                style={{backgroundImage: solution.image ? `url(${solution.image})` : '', backgroundSize: 'cover', backgroundPosition: 'center'}}
              />
              <h3 className="text-xl font-semibold mb-2 text-white">
                {solution.title}
              </h3>
              <p className="text-white/80 mb-4">{solution.description}</p>
              <Button variant="ghost" className="text-white hover:text-white/90 p-0 flex items-center gap-2">
                Learn more <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
