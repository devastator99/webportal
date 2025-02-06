import { Button } from "@/components/ui/button";

interface HeroProps {
  onGetStarted?: () => void;
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#6E59A5] mb-6">
            Your Mental Health Journey Starts Here
          </h1>
          <p className="text-lg md:text-xl text-[#7E69AB] mb-8">
            Connect with experienced therapists and start your path to better mental well-being today.
          </p>
          <Button
            onClick={onGetStarted}
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white px-8 py-3 rounded-lg text-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
};