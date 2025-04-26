
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const beyondFeatures = [
  {
    image: "/lovable-uploads/46f5deea-8449-4a0c-8cc3-4a53a24a7bdb.png",
    title: "Beyond\nMedicine"
  },
  {
    image: "/lovable-uploads/bccd30fa-95fa-4f01-8479-8c069ec6eaa7.png",
    title: "Beyond\nFad diets"
  },
  {
    image: "/lovable-uploads/31d1b71a-f157-47c8-ae65-db954af0ca53.png",
    title: "Beyond\nExercise"
  },
  {
    image: "/lovable-uploads/4db23a12-4300-46fe-a886-2e4515ef7bb4.png",
    title: "Beyond cookie\ncutter treatment"
  }
];

const offerings = [
  {
    title: "DIABETES\nCARE &\nREVERSAL",
    image: "/lovable-uploads/9cc1cd5f-f1fb-4e1b-a58f-aa7018457b02.png"
  },
  {
    title: "WEIGHT\nCARE &\nMANAGEMENT",
    image: "/lovable-uploads/6a5c1bcd-9f5a-456f-9bba-c9c563562a53.png"
  },
  {
    title: "LIFESTYLE\nCARE",
    image: "/lovable-uploads/6e877813-6f6f-4c80-bf38-13ad712b7d4d.png"
  },
  {
    title: "PCOD/ PCOS\nCARE",
    image: "/lovable-uploads/b80d87fa-ba65-4c3d-b6a1-0ffd8b25fe4d.png"
  }
];

export const NewFeatures = () => {
  return (
    <section className="py-20 bg-[#4A2171] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-white mb-16 animate-fade-up">
          Beyond Healthcare
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {beyondFeatures.map((feature, index) => (
            <div key={index} className="flex flex-col items-center animate-fade-up" style={{animationDelay: `${index * 100}ms`}}>
              <img 
                src={feature.image} 
                alt={feature.title} 
                className="w-24 h-24 mb-4 object-contain"
              />
              <h3 className="text-xl font-semibold text-white text-center whitespace-pre-line">{feature.title}</h3>
            </div>
          ))}
        </div>

        {/* Offerings section */}
        <h2 className="text-4xl font-bold text-center text-white mb-4 animate-fade-up">
          Explore Our Offerings
        </h2>
        <p className="text-xl text-white/80 text-center mb-12 animate-fade-up">
          Take charge of your health today
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {offerings.map((offering, index) => (
            <div key={index} className="bg-white rounded-xl overflow-hidden animate-fade-up" style={{animationDelay: `${index * 100}ms`}}>
              <div className="bg-black text-white p-4">
                <div className="mb-2">≡</div>
                <h3 className="text-xl font-bold whitespace-pre-line">{offering.title}</h3>
              </div>
              <div className="h-48 bg-blue-100 relative">
                <img 
                  src={offering.image} 
                  alt={offering.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-blue-500 p-1 rounded-full text-white">*</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button className="bg-black hover:bg-black/90 text-white px-8 py-4 text-lg rounded-full animate-fade-up">
            Start Now
          </Button>
        </div>
      </div>
    </section>
  );
};
