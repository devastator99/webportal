import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
interface TestimonialProps {
  quote: string;
  author: string;
  avatar: string;
  stars: number;
  role?: string;
}
const testimonials: TestimonialProps[] = [{
  quote: "My weight was stuck for years. With AnubhootiHealth, I lost 11 kg without starving — just simple, guided changes. I finally feel light in body and mind.",
  author: "Yashi Swaroop",
  avatar: "/lovable-uploads/5f247b72-d914-4715-b86f-3c4be3b90ea8.png",
  stars: 5,
  role: "Lost 11kg in 3 months"
}, {
  quote: "In just 35 days, my sugar dropped from 273 to 100 and I lost 8 kg. AnubhootiHealth made healing simple, scientific, and supportive.",
  author: "Ayush Kumar",
  avatar: "/lovable-uploads/ee10bae0-3df1-4beb-9586-0c9cf4a9d491.png",
  stars: 5,
  role: "Reversed Type 2 Diabetes"
}, {
  quote: "I'm so thankful to AnubhootiHealth — my sugar levels came down to normal in just one month with the right diet and exercise. Highly recommended for diabetes reversal!",
  author: "Atul Chandan",
  avatar: "/lovable-uploads/7d10a697-4563-40b0-801b-377284ce6c97.png",
  stars: 5,
  role: "Normalized blood sugar"
}, {
  quote: "After struggling with PCOS for years, AnubhootiHealth's program finally gave me relief from symptoms and helped regulate my cycles naturally.",
  author: "Priya Sharma",
  avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
  stars: 5,
  role: "PCOS Management"
}, {
  quote: "The personalized approach and continuous support from the team made all the difference in my health journey. My energy levels are the highest they've been in years!",
  author: "Rajiv Mehta",
  avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
  stars: 5,
  role: "Improved energy & vitality"
}, {
  quote: "AnubhootiHealth's holistic approach addressed both my physical health and mental wellbeing. For the first time, I feel truly balanced.",
  author: "Ananya Desai",
  avatar: "https://images.pexels.com/photos/1987301/pexels-photo-1987301.jpeg",
  stars: 5,
  role: "Stress management"
}];
export const TestimonialCard = ({
  quote,
  author,
  avatar,
  stars,
  role
}: TestimonialProps) => {
  return <Card className="overflow-hidden border-none shadow-lg animate-fade-up h-full flex flex-col">
      <CardContent className="p-0">
        <div className="bg-purple-50 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex">
              {Array.from({
              length: stars
            }).map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
            </div>
            <Quote className="h-8 w-8 text-purple-200" />
          </div>
          <p className="text-gray-700 italic mb-6">{quote}</p>
        </div>
        
        <div className="p-6 bg-white flex items-center mt-auto">
          <img src={avatar} alt={author} className="w-12 h-12 rounded-full mr-4 border-2 border-purple-100" />
          <div>
            <h4 className="font-semibold text-gray-900">{author}</h4>
            {role && <p className="text-sm text-purple-600">{role}</p>}
          </div>
        </div>
      </CardContent>
    </Card>;
};
export const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemsPerPage = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
  const pageCount = Math.ceil(testimonials.length / itemsPerPage);
  const nextPage = () => {
    setActiveIndex(prev => (prev + 1) % pageCount);
  };
  const prevPage = () => {
    setActiveIndex(prev => (prev - 1 + pageCount) % pageCount);
  };
  return <section id="testimonials" className="bg-gray-50 overflow-hidden py-[10px]">
      <div className="container mx-auto px-0">
        <div className="text-center max-w-3xl mx-auto mb-16" data-animate>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            Hear What Our Members Have To Say
          </h2>
          <p className="text-gray-600">
            Real stories from people who transformed their health with our integrated approach
          </p>
        </div>
        
        <div className="relative" data-animate>
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500 ease-in-out" style={{
            transform: `translateX(-${activeIndex * (100 / pageCount)}%)`,
            width: `${pageCount * 100}%`
          }}>
              {Array.from({
              length: pageCount
            }).map((_, pageIndex) => <div key={pageIndex} className="flex-shrink-0" style={{
              width: `${100 / pageCount}%`
            }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                    {testimonials.slice(pageIndex * itemsPerPage, pageIndex * itemsPerPage + itemsPerPage).map((testimonial, i) => <TestimonialCard key={i} {...testimonial} />)}
                  </div>
                </div>)}
            </div>
          </div>
          
          {pageCount > 1 && <div className="flex justify-center mt-10 space-x-4">
              <Button variant="outline" size="icon" onClick={prevPage} className="rounded-full" aria-label="Previous testimonials">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex space-x-2">
                {Array.from({
              length: pageCount
            }).map((_, i) => <button key={i} className={cn("w-2.5 h-2.5 rounded-full transition-colors", i === activeIndex ? "bg-purple-600" : "bg-gray-300 hover:bg-gray-400")} onClick={() => setActiveIndex(i)} aria-label={`Go to page ${i + 1}`} />)}
              </div>
              
              <Button variant="outline" size="icon" onClick={nextPage} className="rounded-full" aria-label="Next testimonials">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>}
        </div>
        
        <div data-animate className="mt-20 bg-white rounded-2xl p-8 shadow-md px-0 py-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{
            label: "Users Helped",
            value: "9,500+",
            description: "Happy clients on their health journey"
          }, {
            label: "Average Weight Loss",
            value: "8.3 kg",
            description: "In first 3 months of program"
          }, {
            label: "Diabetes Reversal",
            value: "87%",
            description: "Success rate in reducing medication"
          }].map((stat, i) => <div key={i} className="text-center p-6">
                <div className="text-4xl font-bold mb-2 text-purple-700">{stat.value}</div>
                <div className="text-lg font-semibold mb-2 text-gray-900">{stat.label}</div>
                <div className="text-gray-600 text-sm">{stat.description}</div>
              </div>)}
          </div>
        </div>
      </div>
    </section>;
};