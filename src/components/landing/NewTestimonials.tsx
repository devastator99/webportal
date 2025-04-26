
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const testimonials = [
  {
    text: "The virtual consultations have made managing my health so much easier. I can connect with my doctor whenever I need to.",
    author: "Sarah Johnson",
    role: "Patient"
  },
  {
    text: "As a healthcare provider, this platform has revolutionized how I collaborate with other specialists for patient care.",
    author: "Dr. Michael Chen",
    role: "Cardiologist"
  },
  {
    text: "The health monitoring features help me stay on track with my wellness goals. It's like having a personal health assistant.",
    author: "David Martinez",
    role: "Patient"
  }
];

export const NewTestimonials = () => {
  return (
    <section className="py-20 px-4 md:px-6 bg-[#F6F8FD]">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#7E69AB] mb-12 animate-fade-up">
          What Our Users Say
        </h2>
        <div className="max-w-4xl mx-auto">
          <Carousel>
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index}>
                  <div className="bg-white p-8 rounded-xl shadow-sm">
                    <p className="text-lg text-[#6E59A5] mb-6 italic">
                      "{testimonial.text}"
                    </p>
                    <div>
                      <p className="font-semibold text-[#7E69AB]">{testimonial.author}</p>
                      <p className="text-sm text-[#9b87f5]">{testimonial.role}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
};
