'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface Profile {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  entrepreneurType: string;
  businessStage: string;
  photos: string[];
  interests: string[];
  lookingFor: string[];
  gender: 'male' | 'female';
}

// Test data for development
const testProfiles: Profile[] = [
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
    lookingFor: ['Co-founder', 'Mentor', 'Investor', 'Life Partner'],
    gender: 'female'
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
    lookingFor: ['Business Partner', 'Investor', 'Life Partner'],
    gender: 'female'
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
    lookingFor: ['Co-founder', 'Life Partner', 'Mentor'],
    gender: 'female'
  }
];

export default function TestSwipePage() {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [direction, setDirection] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayType, setOverlayType] = useState<'like' | 'dislike' | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For testing, set a mock user profile
    setUserProfile({
      id: 'test-user',
      name: 'Test User',
      age: 30,
      location: 'Test Location',
      bio: 'Test Bio',
      entrepreneurType: 'Test Type',
      businessStage: 'Test Stage',
      photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop'],
      interests: ['Test Interest'],
      lookingFor: ['Test Looking For'],
      gender: 'male'
    });

    // Use test profiles for now
    setProfiles(testProfiles);
    setLoading(false);
  }, []);

  const handleSwipe = (direction: 'left' | 'right') => {
    setDirection(direction === 'right' ? 1 : -1);
    setOverlayType(direction === 'right' ? 'like' : 'dislike');
    setShowOverlay(true);
    
    // Hide overlay after animation
    setTimeout(() => {
      setShowOverlay(false);
      setCurrentIndex((prev) => prev + 1);
    }, 500);
  };

  const handleLike = () => {
    handleSwipe('right');
  };

  const handleDislike = () => {
    handleSwipe('left');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

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
      {/* Main Content */}
      <div className="pt-8 pb-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, x: 300 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 * direction }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden relative"
            >
              {/* Overlay for Like/Dislike */}
              <AnimatePresence>
                {showOverlay && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-32 left-[40%] z-10"
                  >
                    <div className={`rounded-full p-4 shadow-lg ${
                      overlayType === 'like' 
                        ? 'bg-green-500/90' 
                        : 'bg-red-500/90'
                    }`}>
                      {overlayType === 'like' ? (
                        <CheckIcon className="h-12 w-12 text-white" />
                      ) : (
                        <XMarkIcon className="h-12 w-12 text-white" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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