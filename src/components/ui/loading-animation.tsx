import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loadingMessages = [
  "🔍 Searching far and wide for the best deals...",
  "🛍️ Comparing prices across Ghana's top stores...",
  "💡 Pro tip: Take a deep breath while we find your perfect match!",
  "🎯 Finding the best value for your money...",
  "🌟 Good things come to those who wait...",
  "🚀 Our digital bargain hunters are on the case!",
  "🎁 Unwrapping the best offers just for you...",
  "⚡ Scanning at the speed of light...",
  "🌍 Searching across Ghana's favorite stores...",
  "💪 Almost there! The deals are worth the wait...",
  "🎨 Painting a picture of perfect prices...",
  "🎭 Behind the scenes: Our AI is working its magic...",
  "🎪 The greatest deals show is about to begin...",
  "🎯 Precision searching in progress...",
  "🔮 Crystal ball says: Amazing deals incoming!"
];

export function LoadingAnimation() {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="mb-8"
      >
        <div className="relative">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-1/2 left-1/2 w-8 h-8 -mt-4 -ml-4 border-4 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-lg font-medium text-gray-700 mb-2">
            {loadingMessages[currentMessage]}
          </p>
          <p className="text-sm text-gray-500">
            Finding the best deals takes a moment...
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
