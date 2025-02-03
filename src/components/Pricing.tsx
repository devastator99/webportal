import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Basic Consultation",
    price: "₹1,499",
    features: [
      "Initial consultation",
      "Basic health screening",
      "Digital prescription",
      "Follow-up within 2 weeks",
    ],
  },
  {
    name: "Comprehensive Care",
    price: "₹3,999",
    features: [
      "Detailed consultation",
      "Complete hormone panel",
      "Personalized treatment plan",
      "3 follow-up visits",
    ],
  },
  {
    name: "Premium Package",
    price: "₹7,999",
    features: [
      "Priority appointments",
      "Comprehensive diagnostics",
      "Quarterly health monitoring",
      "Unlimited follow-ups",
    ],
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-saas-light-purple">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#7E69AB] mb-12">
          Affordable Care Packages
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-[#7E69AB]">{plan.name}</CardTitle>
                <div className="text-4xl font-bold text-center text-[#9b87f5] mt-4">
                  {plan.price}
                  <span className="text-lg text-[#6E59A5]">/consultation</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-[#9b87f5] mr-2" />
                      <span className="text-[#6E59A5]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]">
                  Book Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};