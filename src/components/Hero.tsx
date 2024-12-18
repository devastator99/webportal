import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <div className="pt-32 pb-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-saas-dark mb-6 animate-fade-up">
          Transform Your Business with Our SaaS Solution
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-up [animation-delay:200ms]">
          Streamline your workflow, boost productivity, and scale your business with our powerful platform.
        </p>
        <div className="flex justify-center gap-4 animate-fade-up [animation-delay:400ms]">
          <Button className="bg-saas-purple hover:bg-saas-purple/90 text-lg px-8 py-6">
            Start Free Trial
          </Button>
          <Button variant="outline" className="text-lg px-8 py-6">
            Watch Demo
          </Button>
        </div>
      </div>
    </div>
  );
};