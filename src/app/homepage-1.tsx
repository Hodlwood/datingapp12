'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Homepage1() {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleGenderSelect = (gender: string) => {
    console.log('Gender selected:', gender);
    setSelectedGender(gender);
    setShowOnboarding(true);
  };

  console.log('Current state:', { selectedGender, showOnboarding });

  if (showOnboarding && selectedGender) {
    console.log('Showing onboarding with gender:', selectedGender);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Onboarding Flow</h1>
          <p>Selected gender: {selectedGender}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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

      <div className="relative pt-32">
        <div className="max-w-2xl mx-auto">
          <div className="relative z-10 pb-8">
            <main className="mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Find Your</span>
                  <span className="block text-blue-600">Entrepreneur Match</span>
                </h2>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl">
                  Connect with like-minded entrepreneurs who share your vision and values. Build meaningful relationships while building your businesses together.
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-2xl font-bold text-center mb-8">I am a...</h3>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                selectedGender === 'male'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
              }`}
              onClick={() => {
                console.log('Man button clicked');
                handleGenderSelect('male');
              }}
            >
              Man
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                selectedGender === 'female'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
              }`}
              onClick={() => {
                console.log('Woman button clicked');
                handleGenderSelect('female');
              }}
            >
              Woman
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
} 