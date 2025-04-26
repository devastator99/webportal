
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const OfferingsSection = () => {
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

  return (
    <section className="section-dark">
      <div className="container mx-auto">
        <h2 className="section-heading">Explore Our Offerings</h2>
        <p className="text-xl mb-8">Take charge of your health today</p>
        
        <div className="offerings-grid">
          <div className="offering-card">
            <div className="offering-header">≡</div>
            <div className="p-4">
              <h3 className="text-black text-2xl font-bold">DIABETES CARE & REVERSAL</h3>
            </div>
            <img 
              src="/lovable-uploads/90f15a11-74d0-46f1-8b5f-38cb0b2595d4.png" 
              alt="Diabetes care" 
              className="offering-image"
            />
          </div>
          
          <div className="offering-card">
            <div className="offering-header">≡</div>
            <div className="p-4">
              <h3 className="text-black text-2xl font-bold">WEIGHT CARE & MANAGEMENT</h3>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" 
              alt="Weight care" 
              className="offering-image"
            />
          </div>
          
          <div className="offering-card">
            <div className="offering-header">≡</div>
            <div className="p-4">
              <h3 className="text-black text-2xl font-bold">LIFESTYLE CARE</h3>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb" 
              alt="Lifestyle care" 
              className="offering-image"
            />
          </div>
          
          <div className="offering-card">
            <div className="offering-header">≡</div>
            <div className="p-4">
              <h3 className="text-black text-2xl font-bold">PCOD/PCOS CARE</h3>
            </div>
            <img 
              src="/lovable-uploads/85c51479-e739-41cb-92db-1f9331c6e677.png" 
              alt="PCOS care" 
              className="offering-image"
            />
          </div>
        </div>
        
        <div className="flex justify-center mt-12">
          <button onClick={handleStartClick} className="action-button">
            Start Now
          </button>
        </div>
      </div>
    </section>
  );
};
