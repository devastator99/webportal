import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Starter",
    price: "$29",
    features: ["Up to 5 users", "Basic analytics", "24/7 support", "1 project"],
  },
  {
    name: "Professional",
    price: "$99",
    features: ["Up to 20 users", "Advanced analytics", "Priority support", "10 projects"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["Unlimited users", "Custom analytics", "Dedicated support", "Unlimited projects"],
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-saas-light-purple">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-saas-dark mb-12">
          Simple, Transparent Pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">{plan.name}</CardTitle>
                <div className="text-4xl font-bold text-center text-saas-purple mt-4">
                  {plan.price}
                  {plan.price !== "Custom" && <span className="text-lg text-gray-500">/month</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-saas-purple mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-saas-purple hover:bg-saas-purple/90">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};