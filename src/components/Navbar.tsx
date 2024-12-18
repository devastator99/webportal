import { Button } from "@/components/ui/button";

export const Navbar = () => {
  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-saas-purple">SaaSLogo</div>
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-saas-dark hover:text-saas-purple transition-colors">Features</a>
          <a href="#testimonials" className="text-saas-dark hover:text-saas-purple transition-colors">Testimonials</a>
          <a href="#pricing" className="text-saas-dark hover:text-saas-purple transition-colors">Pricing</a>
        </div>
        <Button className="bg-saas-purple hover:bg-saas-purple/90">Get Started</Button>
      </div>
    </nav>
  );
};