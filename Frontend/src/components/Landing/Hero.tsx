import { ArrowRight, Play, BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EducationHero() {
    const navigate = useNavigate()
  return (
    
    <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-peach-50 to-teal-50 overflow-hidden mt-10">
    
      <div className="absolute top-22 right-12 w-32 h-32 border-4 border-orange-300 rounded-full opacity-30 "></div>
      <div className="absolute bottom-40 left-11 w-24 h-24 bg-teal-200 rounded-lg opacity-90  rotate-45"></div>
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-orange-200 rounded-full opacity-70"></div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
           

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Build Your Skills
              <br />
              on the <span className="bg-orange-300 px-3 py-1 rounded-lg">Best</span>
              <br />
              Platform
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed">
              Find Curated Courses That teach You How to master the 
              Process of Developing Your Skills
            </p>

            <div className="flex flex-wrap gap-4">
              <button className=" cursor-pointer px-6 py-3 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition-colors font-medium "
               onClick={() => navigate("/login")}
              >
                Get Started
              </button>
              
            </div>

            
          </div>

          {/* Right Content - Image Card */}
          <div className="relative">
            <div className="relative bg-teal-700 rounded-3xl overflow-hidden shadow-xl">
              {/* Decorative stripes */}
              <div className="absolute top-0 left-0 w-1/3 h-full bg-orange-100 opacity-20" 
                   style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }}></div>
              
              {/* Header */}
              <div className="relative z-10 p-6 flex justify-between items-start">
                <div className="text-white text-xl font-medium">PadhaiHub</div>
                <div className="flex gap-2">
                  <button className=" cursor-pointer px-4 py-2 bg-white/20 text-white rounded-md text-sm hover:bg-white/30 transition-colors
                  
                  "
                  onClick={() => navigate("/login")}
                  >
                    Log in
                  </button>
                  <button className=" cursor-pointer px-4 py-2 bg-orange-400 text-white rounded-md text-sm hover:bg-orange-500 transition-colors"
                  onClick={() => navigate("/register")}
                  >
                    Sign up
                  </button>
                </div>
              </div>

              {/* Main Image Area */}
              <div className="relative px-6 pb-8">
                <div className="bg-orange-100 rounded-2xl p-8 flex items-end justify-center min-h-[300px] relative overflow-hidden">
                  {/* Decorative stripes in image area */}
                  <div className="absolute top-0 right-0 w-20 h-full" 
                       style={{ background: 'repeating-linear-gradient(0deg, #fed7aa 0px, #fed7aa 8px, transparent 8px, transparent 16px)' }}></div>
                  
                  {/* Abstract shapes */}
                  <div className="absolute top-10 right-20 w-16 h-16 border-2 border-teal-600 rounded-lg opacity-40"></div>
                  <div className="absolute top-24 right-32">
                    <svg width="40" height="40" viewBox="0 0 40 40" className="text-teal-600 opacity-40">
                      <path d="M20 5 L35 35 L5 35 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>

                  {/* Placeholder for person */}
                  <div className="w-48 h-69 bg-orange-300 rounded-t-full"></div>
                  
                  {/* Floating paper element */}
                  <div className="absolute bottom-20 left-8 w-24 h-32 bg-pink-300 rounded-lg shadow-lg transform -rotate-13"></div>
                </div>

                {/* Decorative bottom pattern */}
                <div className="absolute bottom-0 left-0 right-0 h-16" 
                     style={{ background: 'repeating-linear-gradient(45deg, transparent 0px, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)' }}></div>
              </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute -z-10 top-8 -right-8 w-full h-full bg-gradient-to-br from-orange-200 to-teal-200 rounded-3xl opacity-30"></div>
          </div>
        </div>

        {/* Bottom Stats Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-teal-700">260K+</div>
              <div className="text-sm text-gray-600">Students</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-teal-700" />
              </div>
              <div className="text-2xl font-bold text-teal-700">24+</div>
              <div className="text-sm text-gray-600">Courses</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-teal-700">850+</div>
              <div className="text-sm text-gray-600">Certified</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-teal-700" />
              </div>
              <div className="text-2xl font-bold text-teal-700">2M+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}