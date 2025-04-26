
import React from 'react';

export const BenefitsSection = () => {
  return (
    <section className="section-light">
      <div className="container mx-auto">
        <h2 className="section-heading">
          How AnubhootiHealth will help you become the best version of yourself
        </h2>
        <p className="text-lg mb-6">
          See results within 15 days
        </p>
        <p className="text-lg mb-16 max-w-3xl">
          Anubhootihealth: A 360° wellness revolution—blending AI brilliance with real doctors 
          and counselors to conquer lifestyle diseases at their roots. Affordable, accessible, 
          and truly transformative.
        </p>

        <h2 className="text-3xl font-bold mb-4">Beyond Healthcare</h2>
        
        <div className="services-grid">
          <div className="service-card">
            <img 
              src="/lovable-uploads/870b51cf-c572-4707-b400-708b5ad12f86.png" 
              alt="Medicine" 
              className="service-icon" 
            />
            <div className="service-title">Beyond Medicine</div>
          </div>
          
          <div className="service-card">
            <img 
              src="/lovable-uploads/e2178f5b-75e8-47aa-909a-2340b57758dd.png" 
              alt="Fad diets" 
              className="service-icon" 
            />
            <div className="service-title">Beyond Fad diets</div>
          </div>
          
          <div className="service-card">
            <img 
              src="/lovable-uploads/ecd6da5c-7ed5-48c7-b797-3b08861101ff.png" 
              alt="Exercise" 
              className="service-icon" 
            />
            <div className="service-title">Beyond Exercise</div>
          </div>
          
          <div className="service-card">
            <img 
              src="/lovable-uploads/6a04391b-fa05-4749-915c-eb13092dc340.png" 
              alt="Treatment" 
              className="service-icon" 
            />
            <div className="service-title">Beyond cookie cutter treatment</div>
          </div>
        </div>
      </div>
    </section>
  );
};
