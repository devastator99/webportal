
import React from 'react';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
}

export const Team: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      name: 'Dr. Kumar Anuj',
      role: 'Lead Physician',
      description: 'With extensive experience in endocrinology, Dr. Anuj leads our medical team, providing expert guidance and care.',
      image: 'https://source.unsplash.com/featured/200x200/?doctor,male'
    },
    {
      name: 'Dr. Khushboo Tewary',
      role: 'Gynecologist',
      description: 'A respected expert in women's health with decades of experience in gynecology.',
      image: 'https://source.unsplash.com/featured/200x200/?doctor,female'
    },
    {
      name: 'Aparna Kashyap',
      role: 'Chief Dietitian',
      description: 'Expert in nutrition and holistic wellness with vast experience in diabetes management.',
      image: 'https://source.unsplash.com/featured/200x200/?nutritionist,female'
    }
  ];

  return (
    <section id="team" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Our Expert Team</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src={member.image} 
                alt={member.name} 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-primary font-medium">{member.role}</p>
                <p className="mt-3 text-gray-600">{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
