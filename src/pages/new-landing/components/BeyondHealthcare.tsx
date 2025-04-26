
import React from 'react';
import { motion } from 'framer-motion';

const items = [
  {
    title: "Beyond\nMedicine",
    icon: "/lovable-uploads/21db2a0c-859b-4df9-a426-b2953b7af92d.png",
    description: "We go beyond traditional medicine to address your health at its roots"
  },
  {
    title: "Beyond\nFad diets",
    icon: "/lovable-uploads/870b51cf-c572-4707-b400-708b5ad12f86.png",
    description: "Sustainable nutrition plans based on your unique needs, not trends"
  },
  {
    title: "Beyond\nExercise",
    icon: "/lovable-uploads/84490f3a-446e-485c-871d-a173180f2eef.png",
    description: "Movement that enhances your life and respects your body's capabilities"
  },
  {
    title: "Beyond cookie\ncutter treatment",
    icon: "/lovable-uploads/5989b36b-4d21-46b9-9fee-38c13b8afdf3.png",
    description: "Personalized care plans designed specifically for your health journey"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const iconVariants = {
  hidden: { 
    scale: 0.8,
    rotate: -5
  },
  visible: { 
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
};

export const BeyondHealthcare = () => {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-purple-50 opacity-70" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-cyan-50 opacity-70" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-900"
        >
          Beyond Healthcare
        </motion.h2>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {items.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-center text-center space-y-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <motion.div
                variants={iconVariants}
                whileHover={{ 
                  scale: 1.05,
                  rotate: [0, -5, 5, 0],
                  transition: { duration: 0.5 }
                }}
                className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-purple-50 to-cyan-50 rounded-full p-4"
              >
                <img 
                  src={item.icon} 
                  alt={item.title} 
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <h3 className="text-2xl font-semibold text-purple-900 whitespace-pre-line">
                {item.title}
              </h3>
              <p className="text-gray-600">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
