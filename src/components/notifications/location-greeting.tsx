'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface LocationData {
  country: string;
  city?: string;
  flag?: string;
}

export function LocationGreeting() {
  const [isVisible, setIsVisible] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        // Get country flag emoji
        const countryCode = data.country_code;
        const flag = countryCode
          ? String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => c.charCodeAt(0) + 127397))
          : '🌍';

        setLocation({
          country: data.country_name,
          city: data.city,
          flag: flag
        });
        
        // Show notification after a short delay
        setTimeout(() => setIsVisible(true), 1500);
        
        // Auto-hide after 5 seconds
        setTimeout(() => setIsVisible(false), 6500);
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    };

    fetchLocation();
  }, []);

  if (!location) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-white rounded-lg shadow-lg p-4 pr-12 relative max-w-md backdrop-blur-sm bg-opacity-90">
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-start space-x-3">
              <div className="text-4xl">{location.flag}</div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Welcome to Can I Buy?
                </h3>
                <p className="text-gray-600">
                  {location.city 
                    ? `Greetings from ${location.city}, ${location.country}! 🎉`
                    : `Greetings from ${location.country}! 🎉`
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
