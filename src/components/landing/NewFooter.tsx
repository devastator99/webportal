
import { Logo } from "@/components/navbar/Logo";

export const NewFooter = () => {
  return (
    <footer className="bg-white py-12 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Logo />
            <p className="mt-4 text-[#6E59A5]">
              Transforming healthcare through innovative technology solutions.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-[#7E69AB] mb-4">Solutions</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-[#6E59A5] hover:text-[#9b87f5]">Virtual Consultations</a></li>
              <li><a href="#" className="text-[#6E59A5] hover:text-[#9b87f5]">Health Monitoring</a></li>
              <li><a href="#" className="text-[#6E59A5] hover:text-[#9b87f5]">Care Team Collaboration</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-[#7E69AB] mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-[#6E59A5] hover:text-[#9b87f5]">About Us</a></li>
              <li><a href="#" className="text-[#6E59A5] hover:text-[#9b87f5]">Contact</a></li>
              <li><a href="#" className="text-[#6E59A5] hover:text-[#9b87f5]">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-[#7E69AB] mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-[#6E59A5] hover:text-[#9b87f5]">Privacy Policy</a></li>
              <li><a href="#" className="text-[#6E59A5] hover:text-[#9b87f5]">Terms of Service</a></li>
              <li><a href="#" className="text-[#6E59A5] hover:text-[#9b87f5]">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-[#E5DEFF]">
          <p className="text-center text-[#6E59A5]">
            © 2025 Healthcare Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
