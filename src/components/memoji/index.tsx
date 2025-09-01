import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MemojiProps {
  type: 'shopping' | 'thinking' | 'happy' | 'excited' | 'winking' | 'thumbs-up';
  className?: string;
}

const MEMOJI_SEEDS: Record<MemojiProps['type'], string> = {
  shopping: 'shopping-cart',
  thinking: 'thinking-face',
  happy: 'smiling-face',
  excited: 'star-struck',
  winking: 'winking-face',
  'thumbs-up': 'thumbs-up'
};

const MEMOJI_COLORS: Record<MemojiProps['type'], [string, string]> = {
  shopping: ['from-blue-400', 'to-blue-600'],
  thinking: ['from-purple-400', 'to-purple-600'],
  happy: ['from-green-400', 'to-green-600'],
  excited: ['from-yellow-400', 'to-yellow-600'],
  winking: ['from-pink-400', 'to-pink-600'],
  'thumbs-up': ['from-indigo-400', 'to-indigo-600']
};

export function Memoji({ type, className }: MemojiProps) {
  const [color1, color2] = MEMOJI_COLORS[type];
  const seed = MEMOJI_SEEDS[type];
  
  return (
    <div 
      className={cn(
        'relative w-20 h-20 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-[5deg] hover:shadow-lg memoji-breathing',
        className
      )}
      style={{
        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
      }}
    >
      <div 
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br opacity-90',
          color1,
          color2
        )}
      />
      <div className="relative z-10 w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
        {type === 'shopping' && '🛒'}
        {type === 'thinking' && '🤔'}
        {type === 'happy' && '😊'}
        {type === 'excited' && '🤩'}
        {type === 'winking' && '😉'}
        {type === 'thumbs-up' && '👍'}
      </div>
    </div>
  );
}
