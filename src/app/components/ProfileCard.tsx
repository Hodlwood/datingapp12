'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileCardProps {
  name: string;
  age: number;
  bio: string;
  company: string;
  role: string;
  imageUrl: string;
  interests: string[];
  isTop?: boolean;
  onSwipe?: (direction: number) => void;
}

export default function ProfileCard({ name, age, bio, company, role, imageUrl, interests, isTop = true, onSwipe }: ProfileCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [direction, setDirection] = useState(0);

  const handleSwipe = (dir: number) => {
    setDirection(dir);
    setIsLiked(dir > 0);
    onSwipe?.(dir);
  };

  return (
    <motion.div
      className={`relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden ${!isTop ? 'absolute top-0' : ''}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: direction * 1000, opacity: 0 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = offset.x * velocity.x;
        if (Math.abs(swipe) > 10000) {
          handleSwipe(swipe > 0 ? 1 : -1);
        }
      }}
    >
      <div className="relative h-[600px]">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-white">{name}, {age}</h2>
            <span className="text-white/80">•</span>
            <span className="text-white/80">{company}</span>
          </div>
          <p className="text-white/90 text-sm mb-2">{role}</p>
          <p className="text-white/90 mb-4">{bio}</p>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, index) => (
              <span
                key={index}
                className="bg-white/20 text-white px-3 py-1 rounded-full text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button
          onClick={() => handleSwipe(-1)}
          className="bg-white p-4 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <button
          onClick={() => handleSwipe(1)}
          className="bg-white p-4 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
} 