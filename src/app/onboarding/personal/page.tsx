'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/firebase';
import Image from 'next/image';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function PersonalPreferencesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [formData, setFormData] = useState({
    lookingFor: [] as string[],
    interests: [] as string[],
    relationshipGoals: '',
    bio: '',
    photos: [] as string[],
    filters: {
      ageRange: { min: 18, max: 65 },
      distance: 50,
      entrepreneurTypes: [] as string[],
      businessStages: [] as string[],
      industries: [] as string[],
    }
  });

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

  const entrepreneurTypes = [
    'Startup Founder',
    'Small Business Owner',
    'Serial Entrepreneur',
    'Aspiring Entrepreneur',
    'Investor',
    'Business Consultant'
  ];

  const businessStages = [
    'Idea Stage',
    'Early Development',
    'MVP/Beta',
    'Revenue Generating',
    'Scaling',
    'Established Business'
  ];

  const industries = [
    'Technology',
    'E-commerce',
    'Healthcare',
    'Finance',
    'Education',
    'Real Estate',
    'Manufacturing',
    'Retail',
    'Services',
    'Other'
  ];

  const toggleSelection = (field: 'lookingFor' | 'interests', option: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(option)
        ? prev[field].filter(item => item !== option)
        : [...prev[field], option]
    }));
  };

  const toggleFilter = (field: 'entrepreneurTypes' | 'businessStages' | 'industries', option: string) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [field]: prev.filters[field].includes(option)
          ? prev.filters[field].filter(item => item !== option)
          : [...prev.filters[field], option]
      }
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      setUploadError('Please select a file and ensure you are logged in');
      return;
    }

    // Reset error state
    setUploadError('');
    setUploadingIndex(index);

    try {
      // Basic validations
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPG, PNG, etc.)');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB');
      }

      // Log Firebase Storage initialization
      console.log('Checking Firebase Storage initialization...');
      console.log('Storage bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
      console.log('User ID:', user.uid);
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Verify storage is initialized
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }

      // Create a unique filename with timestamp and original extension
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `photo_${Date.now()}.${extension}`;
      
      // Use the correct path that matches our storage rules
      const storageRef = ref(storage, `users/${user.uid}/photos/${filename}`);
      console.log('Storage reference created:', storageRef.fullPath);

      // Upload the file
      console.log('Starting upload...');
      const uploadResult = await uploadBytes(storageRef, file);
      console.log('Upload successful:', uploadResult);

      // Get the download URL
      console.log('Getting download URL...');
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('Download URL received:', downloadURL);

      // Update the photos array
      const newPhotos = [...formData.photos];
      while (newPhotos.length < 6) {
        newPhotos.push('');
      }
      newPhotos[index] = downloadURL;

      setFormData(prev => ({
        ...prev,
        photos: newPhotos
      }));

    } catch (error) {
      console.error('Upload error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: error instanceof Error ? (error as any).code : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingIndex(null);
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newPhotos = [...prev.photos];
      newPhotos[index] = '';
      return {
        ...prev,
        photos: newPhotos.filter(Boolean)
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Get existing data from localStorage
      const existingData = localStorage.getItem('profileData');
      const existingProfile = existingData ? JSON.parse(existingData) : {};

      // Combine existing data with new data
      const updatedProfile = {
        ...existingProfile,
        lookingFor: formData.lookingFor,
        interests: formData.interests,
        relationshipGoals: formData.relationshipGoals,
        bio: formData.bio,
        filters: formData.filters
      };

      // Save to localStorage
      localStorage.setItem('profileData', JSON.stringify(updatedProfile));

      // Redirect to profile page
      router.push('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      setUploadError('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Personal Preferences</h1>
          <p className="text-gray-600 mt-2">Tell us about what you're looking for</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Looking For */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              I am looking for... (select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {lookingForOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('lookingFor', option)}
                  className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                    formData.lookingFor.includes(option)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Relationship Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              My primary goal is...
            </label>
            <div className="grid grid-cols-1 gap-3">
              {relationshipGoalOptions.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, relationshipGoals: goal }))}
                  className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                    formData.relationshipGoals === goal
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              My interests outside of work... (select all that apply)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleSelection('interests', interest)}
                  className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                    formData.interests.includes(interest)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tell others about yourself...
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Share your story, what you're passionate about, and what you hope to achieve..."
            />
          </div>

          {/* Filters Box */}
          <div className="border-2 border-gray-200 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Match Preferences</h3>
            
            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Range
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="18"
                  max={formData.filters.ageRange.max}
                  value={formData.filters.ageRange.min}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    filters: {
                      ...prev.filters,
                      ageRange: { ...prev.filters.ageRange, min: parseInt(e.target.value) }
                    }
                  }))}
                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  min={formData.filters.ageRange.min}
                  max="100"
                  value={formData.filters.ageRange.max}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    filters: {
                      ...prev.filters,
                      ageRange: { ...prev.filters.ageRange, max: parseInt(e.target.value) }
                    }
                  }))}
                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Distance (miles)
              </label>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={formData.filters.distance}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  filters: {
                    ...prev.filters,
                    distance: parseInt(e.target.value)
                  }
                }))}
                className="w-full"
              />
              <div className="text-sm text-gray-600 mt-1">
                {formData.filters.distance} miles
              </div>
            </div>

            {/* Entrepreneur Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entrepreneur Types (select all that interest you)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {entrepreneurTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleFilter('entrepreneurTypes', type)}
                    className={`p-2 text-sm font-medium rounded-lg border transition-all ${
                      formData.filters.entrepreneurTypes.includes(type)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Stages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Stages (select all that interest you)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {businessStages.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => toggleFilter('businessStages', stage)}
                    className={`p-2 text-sm font-medium rounded-lg border transition-all ${
                      formData.filters.businessStages.includes(stage)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industries (select all that interest you)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {industries.map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => toggleFilter('industries', industry)}
                    className={`p-2 text-sm font-medium rounded-lg border transition-all ${
                      formData.filters.industries.includes(industry)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Add Your Photos (Up to 6)
            </label>
            {uploadError && (
              <p className="text-sm text-red-600 mb-2">{uploadError}</p>
            )}
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
                >
                  {formData.photos[index] ? (
                    <div className="group relative w-full h-full">
                      <Image
                        src={formData.photos[index]}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, index)}
                        disabled={uploadingIndex !== null}
                      />
                      {uploadingIndex === index ? (
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                          <span className="text-sm text-gray-500">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <PlusIcon className="h-8 w-8 text-gray-400 mb-1" />
                          <span className="text-sm text-gray-500">Add Photo</span>
                        </div>
                      )}
                    </label>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Add up to 6 photos. First photo will be your profile picture. Each photo must be less than 5MB.
            </p>
          </div>

          {/* Next Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-full text-white font-semibold transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 