import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    quote: "This platform has completely transformed how we operate. The efficiency gains are remarkable.",
    author: "Sarah Johnson",
    role: "CEO, TechCorp",
    avatar: "SJ",
  },
  {
    quote: "The best investment we've made for our business. Customer support is outstanding.",
    author: "Michael Chen",
    role: "CTO, StartupX",
    avatar: "MC",
  },
  {
    quote: "Intuitive interface and powerful features. It's everything we needed and more.",
    author: "Emily Davis",
    role: "Product Manager",
    avatar: "ED",
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-saas-dark mb-12">
          Loved by Businesses Worldwide
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <p className="text-gray-600 mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <div className="font-semibold">{testimonial.author}</div>
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