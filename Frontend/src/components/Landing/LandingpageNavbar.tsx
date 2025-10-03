import { GraduationCap, Menu , X} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
    const [isMenuOpen, setisMenuOpen] = useState(false)
    const navigate = useNavigate() 
    return (
          <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200 p-4 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4 ">
            <GraduationCap className="w-9 h-9  text-[#ea7d17]" />
            <span className="text-2xl font-bold text-gray-900">PADHAIHUB</span> 

            


          </div>

          <div className="hidden md:flex items-center gap-14">
            <a href="#features" className="text-gray-700 hover:text-[#076d63] transition-colors text-xl">
              Features
            </a>
            <a href="#benefits" className="text-gray-700 hover:text-[#076d63] transition-colors text-xl">
              Benefits
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-[#076d63] transition-colors text-xl">
              Pricing
            </a>
            <a href="#contact" className="text-gray-700 hover:text-[#076d63] transition-colors text-xl">
              Contact
            </a>
          
               <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-[#034f47] text-white text-xl rounded-lg hover:bg-[#076d63] transition-colors shadow-md hover:shadow-lg cursorp "
          >
            Get Started 
          </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setisMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            <a
              href="#features"
              className="block py-2 text-gray-700 hover:text-[#076d63] transition-colors"
              onClick={() => setisMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#benefits"
              className="block py-2 text-gray-700 hover:text-[#076d63] transition-colors"
              onClick={() => setisMenuOpen(false)}
            >
              Benefits
            </a>
            <a
              href="#pricing"
              className="block py-2 text-gray-700 hover:text-[#076d63] transition-colors"
              onClick={() => setisMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#contact"
              className="block py-2 text-gray-700 hover:text-[#076d63] transition-colors"
              onClick={() => setisMenuOpen(false)}
            >
              Contact
            </a>
            <button className="w-full py-2 text-gray-700 hover:text-[#076d63] transition-colors text-left">
              Log In
            </button>
            <button className="w-full py-3 text-gray-700   rounded-lg hover:text-[#076d63] transition-colors "
            
            >
              Get Started 
            </button>
          </div>
        </div>
      )}
    </nav>

        
    )

}