import { motion } from 'framer-motion';

interface JumpingMascotProps {
  className?: string;
  delay?: number;
}

export function JumpingMascot({ className = '', delay = 0 }: JumpingMascotProps) {
  return (
    <motion.div
      className={`absolute z-10 ${className}`}
      initial={{ y: 50, opacity: 0, scale: 0.5 }}
      animate={{ 
        y: [50, -20, 50], 
        opacity: 1,
        scale: 1
      }}
      transition={{
        y: {
          delay,
          duration: 1.5,
          repeat: Infinity,
          ease: "easeOut"
        },
        opacity: {
          delay,
          duration: 0.2
        },
        scale: {
          delay,
          duration: 0.2
        }
      }}
    >
      <div className="relative w-16 h-16">
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full drop-shadow-lg"
        >
          {/* Body */}
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="#FFD700"
            stroke="#000"
            strokeWidth="2"
            animate={{
              scale: [1, 1.05, 1],
              y: [0, -2, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Eyes */}
          <motion.g
            animate={{
              y: [0, -1, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <circle cx="24" cy="28" r="4" fill="#000000" />
            <circle cx="40" cy="28" r="4" fill="#000000" />
            
            {/* Eye Shine */}
            <circle cx="25" cy="27" r="1.5" fill="#FFFFFF" />
            <circle cx="41" cy="27" r="1.5" fill="#FFFFFF" />
          </motion.g>
          
          {/* Rosy Cheeks */}
          <circle cx="20" cy="36" r="3" fill="#FFB6C1" opacity="0.6" />
          <circle cx="44" cy="36" r="3" fill="#FFB6C1" opacity="0.6" />
          
          {/* Smile */}
          <motion.path
            d="M24 40 Q32 48 40 40"
            stroke="#000000"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: [
                "M24 40 Q32 48 40 40",
                "M24 42 Q32 50 40 42",
                "M24 40 Q32 48 40 40"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
}
