import React from 'react';
import { useResponsive } from '@/contexts/ResponsiveContext';
export const MobileAppMockup = () => {
  const {
    isMobile,
    isTablet
  } = useResponsive();

  // Updated sizing to be more compact
  const getMockupSize = () => {
    if (isMobile) return {
      width: '80%',
      height: 'auto'
    }; // Reduced from 100%
    if (isTablet) return {
      width: '65%',
      height: 'auto'
    }; // Reduced from 80%
    return {
      width: '75%',
      height: 'auto'
    }; // Reduced from 100%
  };
  return <div className="relative w-full flex justify-center" style={getMockupSize()}>
      <div className="bg-black rounded-3xl overflow-hidden shadow-xl border-8 border-gray-900 aspect-[9/19] relative max-w-[280px]">
        <div className="absolute top-0 left-0 w-full h-6 bg-black flex items-center justify-center">
          <div className="w-16 h-4 bg-gray-900 rounded-b-xl"></div>
        </div>
        <div className="app-screen h-full bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col overflow-hidden">
          <div className="status-bar h-7 bg-black flex justify-between items-center px-4 text-xs text-white">
            <span>9:41</span>
            <div className="flex space-x-1.5">
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M1.371 8.143c5.858-5.857 15.356-5.857 21.213 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.06 0c-4.98-4.979-13.053-4.979-18.032 0a.75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06zm3.182 3.182c4.1-4.1 10.749-4.1 14.85 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.062 0 8.25 8.25 0 0 0-11.667 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06zm3.204 3.182a6 6 0 0 1 8.486 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0 3.75 3.75 0 0 0-5.304 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
                </svg>
              </span>
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v9.375c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v4.875c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 18v-4.875Z" />
                </svg>
              </span>
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M3.75 6.75a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-.037c.856-.174 1.5-.93 1.5-1.838v-2.25c0-.907-.644-1.664-1.5-1.837V9.75a3 3 0 0 0-3-3h-15Zm15 1.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5h15Z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>

          <div className="chat-ui flex-1 bg-gray-900 flex flex-col">
            <div className="chat-header bg-purple-900 p-2 flex items-center">
              <div className="w-8 h-8 rounded-full bg-white overflow-hidden mr-3">
                <img src="/lovable-uploads/e42732ca-e658-4992-8a2d-863555e56873.png" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <div className="text-white text-xs font-medium">Anubhooti Health</div>
                <div className="text-purple-200 text-[10px]">Online</div>
              </div>
            </div>
            <div className="messages-area flex-1 p-3 overflow-hidden my-[10px]">
              <div className="message received bg-purple-800 text-white text-xs p-2 rounded-lg mb-2 max-w-[70%] ml-1">
                Hello! How are you feeling today?
              </div>
              <div className="message sent bg-purple-600 text-white text-xs p-2 rounded-lg mb-2 max-w-[70%] ml-auto mr-1">
                I've been having headaches lately.
              </div>
              <div className="message received bg-purple-800 text-white text-xs p-2 rounded-lg mb-2 max-w-[70%] ml-1">
                I see. Let me ask you a few questions to understand better.
              </div>
              <div className="typing-indicator flex space-x-1 ml-1">
                <div className="dot w-2 h-2 rounded-full bg-purple-400 animate-bounce"></div>
                <div className="dot w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{
                animationDelay: '0.2s'
              }}></div>
                <div className="dot w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{
                animationDelay: '0.4s'
              }}></div>
              </div>
            </div>
            <div className="input-area p-2 bg-gray-800 flex items-center">
              <div className="flex-1 bg-gray-700 rounded-full px-3 py-1 text-xs text-gray-400">Type a message...</div>
              <button className="ml-2 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Health stats floating card - adjusted positioning */}
      <div className="absolute -bottom-4 -right-2 sm:-bottom-5 sm:-right-3 bg-white rounded-lg shadow-lg p-2 sm:p-3 text-xs">
        <div className="font-medium text-gray-800">Health Stats</div>
        <div className="flex items-center mt-1">
          <div className="w-1 h-4 bg-green-500 rounded mr-1"></div>
          <div className="text-gray-600">Sleep: 7.5h</div>
        </div>
        <div className="flex items-center mt-1">
          <div className="w-1 h-4 bg-purple-500 rounded mr-1"></div>
          <div className="text-gray-600">Steps: 8,542</div>
        </div>
      </div>
    </div>;
};