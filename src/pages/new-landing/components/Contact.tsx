
import React from 'react';

export const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-gray-700 mb-8">
            Ready to take the first step on your journey to better health? 
            Connect with us today and discover how we can help you achieve your health goals.
          </p>
          
          <div className="mb-8">
            <a
              href="https://wa.me/917997016598"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-md text-lg font-semibold"
            >
              WhatsApp Us
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Contact Information</h3>
              <p className="mb-2"><span className="font-medium">Email:</span> contact@anubhootihealth.in</p>
              <p className="mb-2"><span className="font-medium">Phone:</span> +91 7997016598</p>
              <p><span className="font-medium">Hours:</span> Mon-Fri: 9am - 6pm</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Follow Us</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-700 hover:text-primary">Instagram</a>
                <a href="#" className="block text-gray-700 hover:text-primary">LinkedIn</a>
                <a href="#" className="block text-gray-700 hover:text-primary">Twitter</a>
                <a href="#" className="block text-gray-700 hover:text-primary">Facebook</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
