
import { Logo } from "@/components/navbar/Logo";

export const NewFooter = () => {
  return (
    <footer className="bg-[#2F3676] py-12 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Logo />
            <p className="mt-4 text-white/80">
              Transforming healthcare through innovative technology solutions.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Solutions</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 hover:text-white">Virtual Consultations</a></li>
              <li><a href="#" className="text-white/80 hover:text-white">Health Monitoring</a></li>
              <li><a href="#" className="text-white/80 hover:text-white">Care Team Collaboration</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 hover:text-white">About Us</a></li>
              <li><a href="#" className="text-white/80 hover:text-white">Contact</a></li>
              <li><a href="#" className="text-white/80 hover:text-white">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="text-white/80 hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="text-white/80 hover:text-white">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-center text-white/70">
            © 2025 Anoobhooti Health. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
