
import React from 'react';
import { motion } from 'framer-motion';

const items = [
  {
    title: "Beyond\nMedicine",
    icon: "/lovable-uploads/21db2a0c-859b-4df9-a426-b2953b7af92d.png",
    delay: 0.2
  },
  {
    title: "Beyond\nFad diets",
    icon: "/lovable-uploads/870b51cf-c572-4707-b400-708b5ad12f86.png",
    delay: 0.4
  },
  {
    title: "Beyond\nExercise",
    icon: "/lovable-uploads/84490f3a-446e-485c-871d-a173180f2eef.png",
    delay: 0.6
  },
  {
    title: "Beyond cookie\ncutter treatment",
    icon: "/lovable-uploads/5989b36b-4d21-46b9-9fee-38c13b8afdf3.png",
    delay: 0.8
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
    rotate: -10
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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold text-center mb-16"
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
              className="flex flex-col items-center text-center space-y-4"
            >
              <motion.div
                variants={iconVariants}
                whileHover={{ 
                  scale: 1.05,
                  rotate: [0, -5, 5, 0],
                  transition: { duration: 0.5 }
                }}
                className="w-32 h-32 flex items-center justify-center"
              >
                <img 
                  src={item.icon} 
                  alt={item.title} 
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <h3 className="text-2xl font-semibold whitespace-pre-line">
                {item.title}
              </h3>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
