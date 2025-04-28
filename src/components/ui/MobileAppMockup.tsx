import { Heart, Calendar, Activity, MessageCircle, User } from 'lucide-react';

export const MobileAppMockup = () => {
  return (
    <div className="relative">
      {/* Phone mockup container */}
      <div className="w-64 md:w-80 h-auto bg-gray-900 rounded-[3rem] border-8 border-gray-800 p-3 shadow-2xl overflow-hidden relative z-10 animate-float">
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
          {/* Status bar */}
          <div className="bg-purple-600 text-white p-6 pt-8 pb-4">
            <div className="flex justify-between items-center">
              <div className="text-xs opacity-80">9:41 AM</div>
              <div className="w-32 h-5 bg-black rounded-full absolute top-2 left-1/2 transform -translate-x-1/2"></div>
              <div className="flex space-x-1">
                <div className="w-4 h-4 rounded-full border border-white opacity-80"></div>
                <div className="w-4 h-4 rounded-full border border-white opacity-80"></div>
                <div className="w-4 h-4 rounded-full border border-white opacity-80"></div>
              </div>
            </div>
            <h2 className="text-lg font-bold mt-6">AnubhootiHealth</h2>
            <div className="flex justify-between mt-4">
              <div className="text-sm opacity-90">Hi, Rakesh!</div>
              <div className="flex items-center space-x-1">
                <Heart size={12} />
                <span className="text-xs">98 bpm</span>
              </div>
            </div>
          </div>
          
          {/* Calendar strip */}
          <div className="flex justify-between px-6 py-3 bg-purple-50">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div 
                key={i} 
                className={`flex flex-col items-center ${i === 5 ? 'bg-purple-100 text-purple-700 rounded-full w-8 h-12 flex items-center justify-center' : ''}`}
              >
                <div className="text-[10px] font-medium">{day}</div>
                <div className="text-xs font-bold">{24 + i}</div>
              </div>
            ))}
          </div>
          
          {/* Main content */}
          <div className="p-4">
            {/* Stats section */}
            <div className="bg-gray-50 rounded-xl p-3 shadow-sm mb-3">
              <div className="flex justify-between">
                <div className="text-xs font-medium text-gray-500">Today's Stats</div>
                <div className="text-xs text-purple-600">View All</div>
              </div>
              <div className="flex justify-around mt-2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <Activity size={16} className="text-teal-600" />
                  </div>
                  <div className="text-xs mt-1">3,200</div>
                  <div className="text-[8px] text-gray-500">Steps</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Heart size={16} className="text-purple-600" />
                  </div>
                  <div className="text-xs mt-1">80 bpm</div>
                  <div className="text-[8px] text-gray-500">Avg Rate</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar size={16} className="text-blue-600" />
                  </div>
                  <div className="text-xs mt-1">1 of 4</div>
                  <div className="text-[8px] text-gray-500">Tasks</div>
                </div>
              </div>
            </div>
            
            {/* AI Chat preview */}
            <div className="bg-gray-50 rounded-xl p-3 shadow-sm mb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-medium text-gray-500">AI Health Assistant</div>
                <div className="bg-green-100 text-green-800 text-[8px] px-2 py-0.5 rounded-full">ONLINE</div>
              </div>
              
              <div className="flex space-x-2 items-end mb-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageCircle size={12} className="text-purple-600" />
                </div>
                <div className="bg-purple-100 text-gray-800 text-[10px] p-2 rounded-lg rounded-bl-none max-w-[80%]">
                  Good morning Rakesh! How are you feeling today?
                </div>
              </div>
              
              <div className="flex flex-row-reverse space-x-reverse space-x-2 items-end">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={12} className="text-gray-600" />
                </div>
                <div className="bg-gray-200 text-gray-800 text-[10px] p-2 rounded-lg rounded-br-none max-w-[80%]">
                  I'm feeling better today! My sugar levels are down.
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-teal-50 p-3 rounded-xl">
                <div className="text-[10px] font-medium text-teal-800 mb-1">Diabetes Control</div>
                <div className="text-[8px] text-teal-600">Track your progress</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl">
                <div className="text-[10px] font-medium text-purple-800 mb-1">Health Journal</div>
                <div className="text-[8px] text-purple-600">Log your updates</div>
              </div>
            </div>
          </div>
          
          {/* Navigation bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around">
            <div className="flex flex-col items-center">
              <Heart size={16} className="text-purple-600" />
              <div className="text-[8px] text-gray-500">Health</div>
            </div>
            <div className="flex flex-col items-center">
              <Calendar size={16} className="text-gray-400" />
              <div className="text-[8px] text-gray-500">Plan</div>
            </div>
            <div className="flex flex-col items-center">
              <Activity size={16} className="text-gray-400" />
              <div className="text-[8px] text-gray-500">Activity</div>
            </div>
            <div className="flex flex-col items-center">
              <User size={16} className="text-gray-400" />
              <div className="text-[8px] text-gray-500">Profile</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -top-8 -left-8 w-32 h-32 bg-teal-400 rounded-full opacity-20 blur-xl animate-float-slow"></div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500 rounded-full opacity-20 blur-xl animate-float"></div>
    </div>
  );
};