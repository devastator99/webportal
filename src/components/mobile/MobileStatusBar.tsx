
import React, { useEffect, useState } from 'react';
import { Battery, Signal, Wifi } from 'lucide-react';

export const MobileStatusBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Update time initially
    updateTime();
    
    // Set interval to update time every minute
    const interval = setInterval(updateTime, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  const updateTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    setCurrentTime(`${hours}:${minutes} ${ampm}`);
  };

  return (
    <div className="status-bar">
      <div className="status-bar-time">{currentTime}</div>
      <div className="status-bar-icons">
        <Signal className="h-3 w-3" />
        <Wifi className="h-3 w-3" />
        <Battery className="h-3 w-3" />
      </div>
    </div>
  );
};
