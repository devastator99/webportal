
import React from 'react';

export const Services: React.FC = () => {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        
        <div className="space-y-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <img
                src="https://source.unsplash.com/featured/800x600/?diabetes,health"
                alt="Diabetes Care"
                className="rounded-lg shadow-md w-full h-auto"
              />
            </div>
            <div className="md:w-1/2 mt-6 md:mt-0">
              <h3 className="text-2xl font-semibold">Diabetes Reversal & Management</h3>
              <p className="mt-4 text-gray-700">
                Our comprehensive diabetes reversal program is designed to help patients 
                regain control of their health. Through personalized nutrition plans, 
                lifestyle modifications, and expert medical guidance, we've helped many 
                patients significantly reduce or eliminate their dependence on medication.
              </p>
              <div className="mt-6">
                <a 
                  href="#" 
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md inline-block"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/2">
              <img
                src="https://source.unsplash.com/featured/800x600/?nutrition,diet"
                alt="Nutrition Counseling"
                className="rounded-lg shadow-md w-full h-auto"
              />
            </div>
            <div className="md:w-1/2 mt-6 md:mt-0">
              <h3 className="text-2xl font-semibold">Personalized Nutrition Plans</h3>
              <p className="mt-4 text-gray-700">
                Our expert nutritionists create customized meal plans tailored to your 
                specific health goals, dietary preferences, and medical conditions. 
                We focus on sustainable eating habits that support long-term health 
                and well-being rather than short-term fixes.
              </p>
              <div className="mt-6">
                <a 
                  href="#" 
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md inline-block"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
