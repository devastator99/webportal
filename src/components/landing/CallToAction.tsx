import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const CallToAction = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-gray-50 to-white"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-100 rounded-full opacity-30 blur-3xl"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-100 rounded-full opacity-30 blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden" data-animate>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 p-8 md:p-12 text-white">
              <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Health?</h2>
              <p className="text-purple-100 mb-8">
                Join thousands who have already started their journey toward better health with AnubhootiHealth's integrative approach.
              </p>
              
              <ul className="space-y-3 mb-8">
                {[
                  "Get started in minutes",
                  "Personalized health programs",
                  "24/7 support from experts",
                  "See results in as little as 15 days"
                ].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <div className="w-5 h-5 rounded-full bg-purple-400 mr-3 flex items-center justify-center">
                      <span className="text-purple-900 font-bold text-xs">✓</span>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-8 md:p-12 bg-white">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Start Your Health Journey Today</h3>
              <p className="text-gray-600 mb-8">
                Fill in your details and one of our health experts will get in touch with you for a free consultation.
              </p>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition duration-200 ease-in-out"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition duration-200 ease-in-out"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition duration-200 ease-in-out"
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <Button className="w-full bg-purple-600 hover:bg-purple-700 transition duration-200 ease-in-out shadow-md text-white">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="mt-20 text-center" data-animate>
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Your Health Transformation Is Just One Step Away
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Whether you're managing a chronic condition or simply want to optimize your health, 
            AnubhootiHealth provides the expertise, technology, and support you need to succeed.
          </p>
        </div>
      </div>
    </section>
  );
};