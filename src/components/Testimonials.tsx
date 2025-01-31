import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    quote: "डॉक्टर ने मेरी थायराइड की समस्या को बहुत अच्छी तरह से समझा और इलाज किया। अब मैं पहले से कहीं बेहतर महसूस करती हूं।",
    author: "प्रिया शर्मा",
    role: "थायराइड पेशेंट",
    avatar: "PS",
  },
  {
    quote: "The diabetes management program here has helped me maintain my blood sugar levels effectively. The doctor's approach is very systematic.",
    author: "Rajesh Kumar",
    role: "Diabetes Patient",
    avatar: "RK",
  },
  {
    quote: "After struggling with PCOD for years, I finally found the right treatment here. The doctor's expertise has made a huge difference.",
    author: "Anjali Mehta",
    role: "PCOD Patient",
    avatar: "AM",
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