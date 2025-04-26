
import React from 'react';
import { Star } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  avatar: string;
  stars: number;
}

const testimonials: Testimonial[] = [
  {
    quote: "My weight was stuck for years. With AnubhootiHealth, I lost 11 kg without starving — just simple, guided changes. I finally feel light in body and mind.",
    author: "Yashi Swaroop",
    avatar: "/lovable-uploads/5f247b72-d914-4715-b86f-3c4be3b90ea8.png",
    stars: 5
  },
  {
    quote: "In just 35 days, my sugar dropped from 273 to 100 and I lost 8 kg. AnubhootiHealth made healing simple, scientific, and supportive",
    author: "Ayush Kumar",
    avatar: "/lovable-uploads/ee10bae0-3df1-4beb-9586-0c9cf4a9d491.png",
    stars: 5
  },
  {
    quote: "I'm so thankful to AnubhootiHealth — my sugar levels came down to normal in just one month with the right diet and exercise. Highly recommended for diabetes reversal!",
    author: "Atul Chandan",
    avatar: "/lovable-uploads/7d10a697-4563-40b0-801b-377284ce6c97.png",
    stars: 5
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 animate-fade-in">
          Hear What Our Members Have To Say
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.stars)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-4">{testimonial.quote}</p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full"
                />
                <span className="font-semibold">{testimonial.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
