
import { Logo } from "@/components/navbar/Logo";

export const NewFooter = () => {
  return (
    <footer className="bg-[#e4f2fd] py-12 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-6 bg-white/80 backdrop-blur rounded-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mr-4"></div>
              <div className="text-2xl font-bold text-black">
                Anubohooti<br />Health
              </div>
            </div>
            <p className="text-gray-700 mb-2">
              A Unit Of Swami Vivekananda<br />
              Integrative Health Services Pvt. Ltd.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 p-6 bg-white/80 backdrop-blur rounded-xl">
            <div>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-700 hover:text-black">Home</a></li>
                <li><a href="#" className="text-gray-700 hover:text-black">About</a></li>
                <li><a href="#" className="text-gray-700 hover:text-black">Classes</a></li>
              </ul>
            </div>
            
            <div>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-700 hover:text-black">Terms & Conditions</a></li>
                <li><a href="#" className="text-gray-700 hover:text-black">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-700 hover:text-black">Refund Policy</a></li>
              </ul>
            </div>
            
            <div>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-700 hover:text-black">Facebook</a></li>
                <li><a href="#" className="text-gray-700 hover:text-black">Instagram</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-600">
          <p>
            © 2025 by Sprint. Built on Lovable
          </p>
        </div>
      </div>
    </footer>
  );
};
