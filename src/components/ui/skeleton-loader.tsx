import React, { useState, useEffect } from 'react';

const loadingPhrases = [
  "🔍 Searching for the best deals...",
  "⚖️ Comparing prices across stores...",
  "🎯 Finding the perfect match...",
  "🏪 Scanning local retailers...",
  "💎 Hunting for bargains...",
  "🧮 Crunching the numbers...",
  "⚡ Almost there...",
  "📦 Checking availability...",
  "🏷️ Looking for special offers...",
  "💰 Getting the latest prices...",
  "🚀 Launching price search...",
  "🌟 Finding amazing deals...",
  "🎁 Unwrapping the best prices...",
  "📱 Scanning tech stores...",
  "🔄 Refreshing prices..."
];

export const SkeletonLoader = () => {
  const [currentPhrase, setCurrentPhrase] = useState(loadingPhrases[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase(prev => {
        const currentIndex = loadingPhrases.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingPhrases.length;
        return loadingPhrases[nextIndex];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Loading message */}
      <div className="flex justify-center items-center mb-8">
        <p className="text-lg font-medium text-gray-600 animate-bounce">
          {currentPhrase}
        </p>
      </div>

      {/* Skeleton cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div 
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {/* Image skeleton */}
            <div className="w-full h-48 bg-gray-200 animate-pulse" />
            
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              
              {/* Price */}
              <div className="h-6 bg-gray-200 rounded w-1/4" />
              
              {/* Store name */}
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              
              {/* Button placeholder */}
              <div className="h-10 bg-gray-200 rounded w-full mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
