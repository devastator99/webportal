import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    quote: "The endocrinology team provided exceptional care for my thyroid condition. I'm feeling better than ever.",
    author: "Sarah Johnson",
    role: "Thyroid Patient",
    avatar: "SJ",
  },
  {
    quote: "Their diabetes management program has helped me maintain stable blood sugar levels and improve my overall health.",
    author: "Michael Chen",
    role: "Diabetes Patient",
    avatar: "MC",
  },
  {
    quote: "Professional, caring, and thorough in their approach to hormone therapy. Highly recommended.",
    author: "Emily Davis",
    role: "Hormone Therapy Patient",
    avatar: "ED",
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#7E69AB] mb-12">
          Patient Success Stories
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-[#D6BCFA]">
              <CardContent className="p-6">
                <p className="text-gray-600 mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 bg-[#E5DEFF]">
                    <AvatarFallback className="text-[#7E69AB]">{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <div className="font-semibold text-[#7E69AB]">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};