import { CheckCircle, Zap, Shield, BarChart } from "lucide-react";

const features = [
  {
    icon: <Zap className="w-6 h-6 text-saas-purple" />,
    title: "Lightning Fast",
    description: "Experience blazing-fast performance with our optimized platform.",
  },
  {
    icon: <Shield className="w-6 h-6 text-saas-purple" />,
    title: "Secure by Design",
    description: "Enterprise-grade security to protect your valuable data.",
  },
  {
    icon: <BarChart className="w-6 h-6 text-saas-purple" />,
    title: "Advanced Analytics",
    description: "Gain valuable insights with our powerful analytics tools.",
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-saas-purple" />,
    title: "Easy Integration",
    description: "Seamlessly integrate with your existing workflow.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 bg-saas-light-purple">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-saas-dark mb-12">
          Features that Set Us Apart
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};