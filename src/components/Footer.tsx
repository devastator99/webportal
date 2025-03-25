export const Footer = () => {
  return (
    <footer className="bg-saas-dark text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-[#9b87f5]">Anoobhooti</h3>
            <p className="text-[#D6BCFA]">
              Transform your healthcare experience with our comprehensive endocrinology platform.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#9b87f5]">Services</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-[#D6BCFA] hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-[#D6BCFA] hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="text-[#D6BCFA] hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#9b87f5]">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-[#D6BCFA] hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-[#D6BCFA] hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-[#D6BCFA] hover:text-white transition-colors">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#9b87f5]">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-[#D6BCFA] hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="text-[#D6BCFA] hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="text-[#D6BCFA] hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#D6BCFA]/20 mt-8 pt-8 text-center text-[#D6BCFA]">
          <p>&copy; 2024 Anoobhooti. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
