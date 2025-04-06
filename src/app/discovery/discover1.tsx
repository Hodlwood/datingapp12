'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, XMarkIcon } from '@heroicons/react/24/solid';

// Sample data for demonstration
const sampleProfiles = [
  {
    id: '1',
    name: 'Sarah Chen',
    age: 38,
    location: 'San Francisco, CA',
    bio: 'Tech entrepreneur building the future of AI. Love hiking and trying new restaurants.',
    entrepreneurType: 'Tech Founder',
    businessStage: 'Series A',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1487412947147-5cebf1000dcd?w=500&h=500&fit=crop'
    ],
    interests: ['Technology', 'Hiking', 'Food', 'Travel', 'Fitness'],
    lookingFor: ['Co-founder', 'Mentor', 'Investor', 'Life Partner']
  },
  {
    id: '2',
    name: 'Emma Rodriguez',
    age: 42,
    location: 'New York, NY',
    bio: 'Serial entrepreneur in the fashion industry. Passionate about sustainable fashion and innovation.',
    entrepreneurType: 'Fashion Entrepreneur',
    businessStage: 'Growth',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&h=500&fit=crop'
    ],
    interests: ['Fashion', 'Sustainability', 'Innovation', 'Art', 'Travel'],
    lookingFor: ['Business Partner', 'Investor', 'Life Partner']
  },
  {
    id: '3',
    name: 'Jessica Kim',
    age: 35,
    location: 'Los Angeles, CA',
    bio: 'Founder of a health tech startup. Love yoga and meditation. Looking for someone who shares my passion for wellness.',
    entrepreneurType: 'Health Tech Founder',
    businessStage: 'Seed',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop'
    ],
    interests: ['Health', 'Technology', 'Yoga', 'Meditation', 'Wellness'],
    lookingFor: ['Co-founder', 'Life Partner', 'Mentor']
  }
];

export default function DiscoveryPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState(sampleProfiles);
  const [direction, setDirection] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  const handleSwipe = (direction: 'left' | 'right') => {
    setDirection(direction === 'right' ? 1 : -1);
    // Here you would typically make an API call to record the swipe
    console.log(`Swiped ${direction} on profile ${profiles[currentIndex].name}`);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleLike = () => {
    handleSwipe('right');
  };

  const handleDislike = () => {
    handleSwipe('left');
  };

  const currentProfile = profiles[currentIndex];

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No more profiles to show</h2>
          <p className="mt-2 text-gray-600">Check back later for more matches!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">eMatch.dating</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="ml-4 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16 pb-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, x: 300 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 * direction }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              {/* Photo Carousel */}
              <div className="relative h-[500px]">
                <Image
                  src={currentProfile.photos[0]}
                  alt={currentProfile.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h2 className="text-2xl font-bold text-white">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  <p className="text-white/90">{currentProfile.location}</p>
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">About</h3>
                  <p className="text-gray-600">{currentProfile.bio}</p>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Entrepreneur Profile</h3>
                  <p className="text-gray-600">
                    {currentProfile.entrepreneurType} • {currentProfile.businessStage}
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Interests</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Looking For</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentProfile.lookingFor.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50 flex justify-center space-x-4">
                <button
                  onClick={handleDislike}
                  className="p-4 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <XMarkIcon className="h-8 w-8 text-red-500" />
                </button>
                <button
                  onClick={handleLike}
                  className="p-4 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <HeartIcon className="h-8 w-8 text-green-500" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 