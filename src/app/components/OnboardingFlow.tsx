'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/firebase';

interface OnboardingData {
  gender: string;
  entrepreneurType: string;
  lookingFor: string[];
  interests: string[];
  relationshipGoals: string;
}

interface OnboardingFlowProps {
  initialGender?: string;
}

const INITIAL_DATA: OnboardingData = {
  gender: '',
  entrepreneurType: '',
  lookingFor: [],
  interests: [],
  relationshipGoals: '',
};

const lookingForOptions = [
  'Co-founder',
  'Business Partner',
  'Investor',
  'Mentor',
  'Networking',
  'Industry Insights',
  'Friendship',
  'Advice'
];

const interestOptions = [
  'Technology',
  'Sports',
  'Travel',
  'Food & Dining',
  'Arts & Culture',
  'Music',
  'Reading',
  'Fitness',
  'Photography',
  'Gaming',
  'Nature',
  'Volunteering'
];

const relationshipGoalOptions = [
  'Long-term Partnership',
  'Short-term Collaboration',
  'Mentorship',
  'Networking',
  'Friendship'
];

export default function OnboardingFlow({ initialGender }: OnboardingFlowProps) {
  const [step, setStep] = useState(initialGender ? 2 : 1);
  const [data, setData] = useState<OnboardingData>({
    ...INITIAL_DATA,
    gender: initialGender || '',
  });
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('OnboardingFlow rendered with initialGender:', initialGender);

  const updateFields = (fields: Partial<OnboardingData>) => {
    console.log('Updating fields:', fields);
    setData(prev => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    console.log('Moving to next step from:', step);
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    console.log('Moving back from step:', step);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date(),
      });
      router.push('/profile');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">I am a...</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                  data.gender === 'male'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => updateFields({ gender: 'male' })}
              >
                Man
              </button>
              <button
                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                  data.gender === 'female'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => updateFields({ gender: 'female' })}
              >
                Woman
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">What type of entrepreneur are you?</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                  data.entrepreneurType === 'founder'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => updateFields({ entrepreneurType: 'founder' })}
              >
                Founder
              </button>
              <button
                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                  data.entrepreneurType === 'investor'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => updateFields({ entrepreneurType: 'investor' })}
              >
                Investor
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">What are you looking for?</h2>
            <div className="grid grid-cols-2 gap-4">
              {lookingForOptions.map((option) => (
                <button
                  key={option}
                  className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                    data.lookingFor.includes(option)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    const newLookingFor = data.lookingFor.includes(option)
                      ? data.lookingFor.filter(item => item !== option)
                      : [...data.lookingFor, option];
                    updateFields({ lookingFor: newLookingFor });
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">What are your interests?</h2>
            <div className="grid grid-cols-2 gap-4">
              {interestOptions.map((option) => (
                <button
                  key={option}
                  className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                    data.interests.includes(option)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    const newInterests = data.interests.includes(option)
                      ? data.interests.filter(item => item !== option)
                      : [...data.interests, option];
                    updateFields({ interests: newInterests });
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">What are your relationship goals?</h2>
            <div className="grid grid-cols-2 gap-4">
              {relationshipGoalOptions.map((option) => (
                <button
                  key={option}
                  className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                    data.relationshipGoals === option
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => updateFields({ relationshipGoals: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Back
              </button>
              <div className="text-sm text-gray-500">
                Step {step} of 5
              </div>
              <button
                onClick={step === 5 ? handleSubmit : handleNext}
                disabled={step === 5 && !data.relationshipGoals}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {step === 5 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
          {renderStep()}
        </div>
      </div>
    </div>
  );
} 