
import { NewHero } from "@/components/landing/NewHero";
import { NewFeatures } from "@/components/landing/NewFeatures";

const NewLandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <NewHero />
      <NewFeatures />
    </div>
  );
};

export default NewLandingPage;
