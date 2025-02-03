import { Stethoscope, Brain, Activity, ClipboardCheck } from "lucide-react";

const features = [
  {
    icon: <Stethoscope className="w-6 h-6 text-[#9b87f5]" />,
    title: "Hormone Disorders",
    description: "Expert treatment for various hormonal imbalances and endocrine conditions.",
  },
  {
    icon: <Brain className="w-6 h-6 text-[#9b87f5]" />,
    title: "Thyroid Care",
    description: "Comprehensive diagnosis and management of thyroid disorders.",
  },
  {
    icon: <Activity className="w-6 h-6 text-[#9b87f5]" />,
    title: "Diabetes Management",
    description: "Personalized diabetes care and blood sugar management plans.",
  },
  {
    icon: <ClipboardCheck className="w-6 h-6 text-[#9b87f5]" />,
    title: "Preventive Care",
    description: "Proactive endocrine health monitoring and prevention strategies.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 bg-[#E5DEFF]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#7E69AB] mb-12">
          Comprehensive Endocrinology Services
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-[#7E69AB]">{feature.title}</h3>
              <p className="text-[#6E59A5]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};