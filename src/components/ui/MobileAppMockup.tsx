
import { Heart, Calendar, Activity, MessageCircle, User } from "lucide-react";

export const MobileAppMockup = () => {
  return (
    <div className="relative">
      {/* Phone mockup container - reduced width for better proportions */}
      <div className="w-40 md:w-48 h-auto bg-gray-900 rounded-[2rem] border-8 border-gray-800 p-2 shadow-2xl overflow-hidden relative z-10 animate-float">
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[1.8rem] overflow-hidden">
          {/* Status bar */}
          <div className="bg-purple-600 text-white p-3 pt-5 pb-2">
            <div className="flex justify-between items-center">
              <div className="text-[8px] opacity-80">9:41 AM</div>
              <div className="w-16 h-2 bg-black rounded-full absolute top-1.5 left-1/2 transform -translate-x-1/2"></div>
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 rounded-full border border-white opacity-80"></div>
                <div className="w-1.5 h-1.5 rounded-full border border-white opacity-80"></div>
                <div className="w-1.5 h-1.5 rounded-full border border-white opacity-80"></div>
              </div>
            </div>
            <h2 className="text-xs font-bold mt-2">AnubhootiHealth</h2>
            <div className="flex justify-between mt-2">
              <div className="text-[8px] opacity-90">Hi, Rakesh!</div>
              <div className="flex items-center space-x-1">
                <Heart size={7} />
                <span className="text-[7px]">98 bpm</span>
              </div>
            </div>
          </div>

          {/* Calendar strip */}
          <div className="flex justify-between px-2 py-1 bg-purple-50">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div
                key={i}
                className={`flex flex-col items-center ${
                  i === 5
                    ? "bg-purple-100 text-purple-700 rounded-full w-3 h-6 flex items-center justify-center"
                    : ""
                }`}
              >
                <div className="text-[5px] font-medium">{day}</div>
                <div className="text-[7px] font-bold">{24 + i}</div>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="p-1.5">
            {/* Stats section */}
            <div className="bg-gray-50 rounded-xl p-1 shadow-sm mb-1.5">
              <div className="flex justify-between">
                <div className="text-[7px] font-medium text-gray-500">
                  Today's Stats
                </div>
                <div className="text-[7px] text-purple-600">View All</div>
              </div>
              <div className="flex justify-around mt-1">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <Activity size={8} className="text-teal-600" />
                  </div>
                  <div className="text-[6px] mt-0.5">3,200</div>
                  <div className="text-[5px] text-gray-500">Steps</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center">
                    <Heart size={8} className="text-purple-600" />
                  </div>
                  <div className="text-[6px] mt-0.5">80 bpm</div>
                  <div className="text-[5px] text-gray-500">Avg Rate</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar size={8} className="text-blue-600" />
                  </div>
                  <div className="text-[6px] mt-0.5">1 of 4</div>
                  <div className="text-[5px] text-gray-500">Tasks</div>
                </div>
              </div>
            </div>

            {/* AI Chat preview */}
            <div className="bg-gray-50 rounded-xl p-1 shadow-sm mb-1.5">
              <div className="flex justify-between items-center mb-0.5">
                <div className="text-[7px] font-medium text-gray-500">
                  AI Health Assistant
                </div>
                <div className="bg-green-100 text-green-800 text-[5px] px-1 py-0.5 rounded-full">
                  ONLINE
                </div>
              </div>

              <div className="flex space-x-1 items-end mb-0.5">
                <div className="w-3 h-3 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageCircle size={6} className="text-purple-600" />
                </div>
                <div className="bg-purple-100 text-gray-800 text-[6px] p-0.5 rounded-lg rounded-bl-none max-w-[80%]">
                  Good morning Rakesh! How are you feeling today?
                </div>
              </div>

              <div className="flex flex-row-reverse space-x-reverse space-x-1 items-end">
                <div className="w-3 h-3 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={6} className="text-gray-600" />
                </div>
                <div className="bg-gray-200 text-gray-800 text-[6px] p-0.5 rounded-lg rounded-br-none max-w-[80%]">
                  I'm feeling better today! My sugar levels are down.
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-teal-50 p-1 rounded-xl">
                <div className="text-[6px] font-medium text-teal-800 mb-0.5">
                  Diabetes Control
                </div>
                <div className="text-[5px] text-teal-600">
                  Track your progress
                </div>
              </div>
              <div className="bg-purple-50 p-1 rounded-xl">
                <div className="text-[6px] font-medium text-purple-800 mb-0.5">
                  Health Journal
                </div>
                <div className="text-[5px] text-purple-600">
                  Log your updates
                </div>
              </div>
            </div>
          </div>

          {/* Navigation bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-0.5 flex justify-around">
            <div className="flex flex-col items-center">
              <MessageCircle size={8} className="text-purple-600" />
              <div className="text-[5px] text-gray-500">Chat</div>
            </div>
            <div className="flex flex-col items-center">
              <Calendar size={8} className="text-gray-400" />
              <div className="text-[5px] text-gray-500">Plans</div>
            </div>
            <div className="flex flex-col items-center">
              <Activity size={8} className="text-gray-400" />
              <div className="text-[5px] text-gray-500">Habits</div>
            </div>
            <div className="flex flex-col items-center">
              <User size={8} className="text-gray-400" />
              <div className="text-[5px] text-gray-500">Profile</div>
            </div>
          </div>
        </div>

        {/* Decorative elements - scaled down */}
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-teal-400 rounded-full opacity-20 blur-xl animate-float-slow"></div>
        <div className="absolute -bottom-6 -right-6 w-14 h-14 bg-purple-500 rounded-full opacity-20 blur-xl animate-float"></div>
      </div>
    </div>
  );
};
