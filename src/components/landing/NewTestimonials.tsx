
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
  },
  {
    text: "See results within 15 days. Anoobhooti Health has transformed my approach to managing my chronic condition.",
    author: "Atul Chandan",
    role: "Member since 2023"
  }
];

export const NewTestimonials = () => {
  return (
    <section className="py-20 px-4 md:px-6 bg-[#2F3676]">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-6 animate-on-scroll">
          See results within 15 days
        </h2>
        <h3 className="text-2xl font-semibold text-center text-white/90 mb-12 animate-on-scroll">
          Hear What Our Members Have To Say
        </h3>
        
        <div className="max-w-4xl mx-auto">
          <Carousel>
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index}>
                  <div className="bg-[#4A2171]/50 backdrop-blur p-8 rounded-xl shadow-lg">
                    <p className="text-lg text-white/90 mb-6 italic">
                      "{testimonial.text}"
                    </p>
                    <div>
                      <p className="font-semibold text-white">{testimonial.author}</p>
                      <p className="text-sm text-white/80">{testimonial.role}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-8">
              <CarouselPrevious className="relative static mr-2 bg-white/10 hover:bg-white/20 text-white border-none" />
              <CarouselNext className="relative static ml-2 bg-white/10 hover:bg-white/20 text-white border-none" />
            </div>
          </Carousel>
        </div>

        {/* Newsletter Section */}
        <div className="mt-24 grid md:grid-cols-2 gap-8 items-center bg-[#4A2171]/30 p-8 rounded-xl">
          <div className="text-left">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">
              Keep up With Our Science Backed Weekly Newsletter-
            </h3>
            <h4 className="text-3xl font-bold italic mb-4 text-white">MetaboliQ</h4>
            <p className="text-white/80">
              Away from all the noise, Trust real science and practical tools for transformation
            </p>
          </div>
          <div>
            <div className="flex flex-col space-y-4">
              <div>
                <label htmlFor="email" className="text-white text-sm mb-1 block">Your Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className="w-full p-3 rounded-lg bg-transparent border-b border-white/30 focus:outline-none focus:border-white text-white"
                  placeholder="Enter your email"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="subscribe" className="rounded-sm" />
                <label htmlFor="subscribe" className="text-white text-sm">Yes, Subscribe me to your newsletter</label>
              </div>
              <Button className="bg-[#00b8d4] hover:bg-[#00a0b7] text-white w-36">
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
