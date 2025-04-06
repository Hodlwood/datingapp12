'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, updateDoc, arrayUnion, Firestore, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/firebase';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { updateProfile } from 'firebase/auth';

interface OnboardingData {
  name: string;
  gender: string;
  interestedIn: string;
  age: number;
  ageRangePreference: {
    min: number;
    max: number;
  };
  location: string;
  entrepreneurType: string;
  businessStage: string;
  lookingFor: string[];
  interests: string[];
  relationshipGoals: string;
  bio: string;
  photos: string[];
}

const INITIAL_DATA: OnboardingData = {
  name: '',
  gender: '',
  interestedIn: '',
  age: 18,
  ageRangePreference: {
    min: 18,
    max: 65,
  },
  location: '',
  entrepreneurType: '',
  businessStage: '',
  lookingFor: [],
  interests: [],
  relationshipGoals: '',
  bio: '',
  photos: [],
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

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Check authentication status
  useEffect(() => {
    if (!authLoading && !user) {
      // If not authenticated, redirect to signup
      router.push('/signup');
    }
  }, [user, authLoading, router]);

  // Set initial gender from URL parameter
  useEffect(() => {
    const gender = searchParams.get('gender');
    if (gender) {
      console.log('Setting gender from URL parameter:', gender);
      setData(prev => ({ ...prev, gender }));
    } else {
      // If no gender in URL, try to get it from localStorage
      const selectedGender = localStorage.getItem('selectedGender');
      if (selectedGender) {
        console.log('Setting gender from localStorage:', selectedGender);
        setData(prev => ({ ...prev, gender: selectedGender }));
      }
    }
  }, [searchParams]);

  // Check for existing profile data (editing mode)
  useEffect(() => {
    const savedProfileData = localStorage.getItem('profileData');
    if (savedProfileData) {
      try {
        const parsedData = JSON.parse(savedProfileData);
        setData(prev => ({
          ...prev,
          ...parsedData
        }));
        // Remove the stored data after loading it
        localStorage.removeItem('profileData');
      } catch (error) {
        console.error('Error parsing saved profile data:', error);
      }
    }
  }, []);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null;
  }

  const updateFields = (fields: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
        onboardingCompleted: true,
        inDiscovery: true,
        createdAt: serverTimestamp(),
        gender: data.gender || localStorage.getItem('selectedGender') || 'male'
      });

      console.log('Profile updated successfully and added to discovery rotation');
      window.location.href = '/profile';
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!user) {
        console.error('No user found');
        return;
      }

      console.log('Starting photo upload for user:', user.uid);

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const path = `users/${user.uid}/photos/${filename}`;

      // Get a reference to the file location
      const storageRef = ref(storage, path);

      // Upload the file
      console.log('Uploading to Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
        },
      });

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Upload successful, download URL:', downloadURL);

      // Update user profile
      await updateProfile(user, {
        photoURL: downloadURL,
      });

      // Update Firestore document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setPhotoURL(downloadURL);
      setPhotoPreview(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">I am interested in...</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                    data.interestedIn === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    updateFields({ interestedIn: 'male' });
                    handleNext();
                  }}
                >
                  Men
                </button>
                <button
                  className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                    data.interestedIn === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50'
                  }`}
                  onClick={() => {
                    updateFields({ interestedIn: 'female' });
                    handleNext();
                  }}
                >
                  Women
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">My age is...</h2>
            <div className="flex flex-col items-center space-y-4">
              <input
                type="number"
                min="18"
                max="100"
                value={data.age}
                onChange={(e) => updateFields({ age: parseInt(e.target.value) })}
                className="w-32 text-center text-2xl p-4 border-2 rounded-lg"
              />
              <div className="flex justify-between w-full">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">I am interested in people aged...</h2>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="18"
                max="100"
                value={data.ageRangePreference.min}
                onChange={(e) => updateFields({ 
                  ageRangePreference: { ...data.ageRangePreference, min: parseInt(e.target.value) }
                })}
                className="w-24 text-center p-2 border-2 rounded-lg"
              />
              <span className="text-lg">to</span>
              <input
                type="number"
                min="18"
                max="100"
                value={data.ageRangePreference.max}
                onChange={(e) => updateFields({ 
                  ageRangePreference: { ...data.ageRangePreference, max: parseInt(e.target.value) }
                })}
                className="w-24 text-center p-2 border-2 rounded-lg"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">Where are you located?</h2>
            <input
              type="text"
              value={data.location}
              onChange={(e) => updateFields({ location: e.target.value })}
              placeholder="Enter your city"
              className="w-full p-4 border-2 rounded-lg text-center"
            />
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">What type of entrepreneur are you?</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                  data.entrepreneurType === 'founder'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => {
                  updateFields({ entrepreneurType: 'founder' });
                  handleNext();
                }}
              >
                Founder
              </button>
              <button
                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                  data.entrepreneurType === 'investor'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => {
                  updateFields({ entrepreneurType: 'investor' });
                  handleNext();
                }}
              >
                Investor
              </button>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">What stage is your business at?</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                  data.businessStage === 'idea'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => {
                  updateFields({ businessStage: 'idea' });
                  handleNext();
                }}
              >
                Idea Stage
              </button>
              <button
                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                  data.businessStage === 'early'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => {
                  updateFields({ businessStage: 'early' });
                  handleNext();
                }}
              >
                Early Stage
              </button>
              <button
                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                  data.businessStage === 'growth'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => {
                  updateFields({ businessStage: 'growth' });
                  handleNext();
                }}
              >
                Growth Stage
              </button>
              <button
                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                  data.businessStage === 'scaling'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => {
                  updateFields({ businessStage: 'scaling' });
                  handleNext();
                }}
              >
                Scaling Stage
              </button>
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">What are you looking for?</h2>
            <div className="grid grid-cols-2 gap-4">
              {lookingForOptions.map((option) => (
                <button
                  key={option}
                  className={`p-4 text-lg font-medium rounded-lg border-2 transition-all ${
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
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">What are your interests?</h2>
            <div className="grid grid-cols-2 gap-4">
              {interestOptions.map((option) => (
                <button
                  key={option}
                  className={`p-4 text-lg font-medium rounded-lg border-2 transition-all ${
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
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
          </motion.div>
        );

      case 9:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">What are your relationship goals?</h2>
            <div className="grid grid-cols-2 gap-4">
              {relationshipGoalOptions.map((option) => (
                <button
                  key={option}
                  className={`p-4 text-lg font-medium rounded-lg border-2 transition-all ${
                    data.relationshipGoals === option
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    updateFields({ relationshipGoals: option });
                    handleNext();
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 10:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">Tell us about yourself</h2>
            <textarea
              value={data.bio}
              onChange={(e) => updateFields({ bio: e.target.value })}
              placeholder="Write a short bio about yourself..."
              className="w-full p-4 border-2 rounded-lg h-32"
            />
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
          </motion.div>
        );

      case 11:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">Add Your Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {data.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {data.photos.length < 6 && (
                <label className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <PlusIcon className="h-8 w-8 text-gray-400" />
                </label>
              )}
            </div>
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Complete Profile
              </button>
            </div>
          </motion.div>
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
                Step {step} of 11
              </div>
              <button
                onClick={step === 11 ? handleSubmit : handleNext}
                disabled={step === 11 && data.photos.length === 0}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {step === 11 ? 'Complete Profile' : 'Next'}
              </button>
            </div>
          </div>
          {renderStep()}
        </div>
      </div>
    </div>
  );
} 