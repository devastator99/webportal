
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const NewHero = () => {
  const navigate = useNavigate();
  const { user, resetInactivityTimer } = useAuth();

  const handleStartClick = () => {
    resetInactivityTimer();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };
  
  // Calendar component
  const CalendarStrip = () => {
    const days = [
      { num: '24', name: 'Mon', active: false },
      { num: '25', name: 'Tue', active: false },
      { num: '26', name: 'Wed', active: false },
      { num: '27', name: 'Thu', active: false },
      { num: '28', name: 'Fri', active: false },
      { num: '29', name: 'Sat', active: true }
    ];
    
    return (
      <div className="floating-calendar animate-float-slow">
        {days.map((day, index) => (
          <div key={index} className={`calendar-day ${day.active ? 'active' : ''}`}>
            <div className="day-number">{day.num}</div>
            <div className="day-name">{day.name}</div>
          </div>
        ))}
      </div>
    );
  };
  
  // Doctor mockup
  const DoctorMockup = () => {
    return (
      <div className="relative mt-8 md:mt-0 animate-float-slow">
        <img 
          src="/lovable-uploads/5989b36b-4d21-46b9-9fee-38c13b8afdf3.png" 
          alt="Doctor" 
          className="w-28 h-28 md:w-36 md:h-36 mx-auto"
        />
      </div>
    );
  };
  
  // Chart mockup
  const ChartMockup = () => {
    return (
      <div className="relative mt-8 mb-8 animate-float">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="54" stroke="#9b87f5" strokeWidth="12" strokeDasharray="339.292" strokeDashoffset="0" />
          <circle cx="60" cy="60" r="54" stroke="#00C2FF" strokeWidth="12" strokeDasharray="339.292" strokeDashoffset="169.646" />
          <circle cx="60" cy="60" r="54" stroke="#4CAF50" strokeWidth="12" strokeDasharray="339.292" strokeDashoffset="254.469" />
          <circle cx="60" cy="60" r="30" fill="#1E0030" />
        </svg>
      </div>
    );
  };

  // App mockup
  const AppMockup = () => {
    return (
      <div className="app-mockup mt-8 md:mt-0 animate-float">
        <div className="mockup-header">
          <div className="mockup-menu">≡</div>
          <div className="mockup-logo">AnubhootiHealth</div>
        </div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2">Hi, Rakesh!</h3>
          <CalendarStrip />
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <ChartMockup />
          <DoctorMockup />
        </div>
        
        <div className="text-xl mb-4">Ai Backed</div>
        
        <div className="flex justify-between mt-8">
          <img 
            src="/lovable-uploads/870b51cf-c572-4707-b400-708b5ad12f86.png"
            alt="Apple"
            className="w-20 h-20"
          />
          <div className="mockup-chat rounded-2xl">
            Hello, how are you?
          </div>
        </div>
        
        <div className="mockup-reply rounded-2xl">
          I'm feeling better today!
        </div>
        
        <div className="flex justify-end mt-8">
          <img 
            src="/lovable-uploads/84490f3a-446e-485c-871d-a173180f2eef.png"
            alt="Runner"
            className="w-24 h-24"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="hero-section">
      {/* Floating elements */}
      <div className="floating-element circle circle-1 animate-float-slow"></div>
      <div className="floating-element circle circle-2 animate-float"></div>
      
      <div className="hero-container">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 text-center md:text-left mb-10 md:mb-0">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Your Health Journey Starts Here
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Integrative medicine solutions
            </p>
            <button 
              onClick={handleStartClick} 
              className="action-button"
            >
              Start Today
            </button>
          </div>
          
          <div className="w-full md:w-1/2 flex justify-center">
            <AppMockup />
          </div>
        </div>
      </div>
    </div>
  );
};
