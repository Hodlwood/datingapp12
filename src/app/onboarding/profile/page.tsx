'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    hometown: '',
  });
  const [errors, setErrors] = useState({
    displayName: '',
    dateOfBirth: '',
    hometown: '',
  });

  // Generate arrays for date selection
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 83 }, (_, i) => currentYear - 100 + i).reverse();

  const validateForm = () => {
    const newErrors = {
      displayName: '',
      dateOfBirth: '',
      hometown: '',
    };
    let isValid = true;

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name is required';
      isValid = false;
    }

    if (!formData.birthMonth || !formData.birthDay || !formData.birthYear) {
      newErrors.dateOfBirth = 'Complete date of birth is required';
      isValid = false;
    } else {
      const birthDate = new Date(
        parseInt(formData.birthYear),
        months.indexOf(formData.birthMonth),
        parseInt(formData.birthDay)
      );
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (age < 18 || (age === 18 && monthDiff < 0)) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
        isValid = false;
      }
    }

    if (!formData.hometown.trim()) {
      newErrors.hometown = 'Hometown is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    // Format the date before storing
    const dateOfBirth = new Date(
      parseInt(formData.birthYear),
      months.indexOf(formData.birthMonth),
      parseInt(formData.birthDay)
    ).toISOString().split('T')[0];

    const profileData = {
      displayName: formData.displayName,
      dateOfBirth,
      hometown: formData.hometown,
    };

    // Store the form data in localStorage for later use
    localStorage.setItem('profileData', JSON.stringify(profileData));
    
    // Move to the next step
    router.push('/onboarding/entrepreneur');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">More About You</h2>
            <p className="mt-2 text-sm text-gray-600">
              Tell us a bit about yourself to help find better matches
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('displayName')?.focus()}
                  className={`relative w-full p-4 text-left border rounded-lg hover:border-blue-500 transition-colors ${
                    formData.displayName ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <input
                    type="text"
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="absolute inset-0 w-full h-full px-4 bg-transparent border-none focus:ring-0"
                    placeholder="Enter your name"
                  />
                </button>
              </div>
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
              )}
            </div>

            {/* Date of Birth Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={formData.birthMonth}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthMonth: e.target.value }))}
                  className={`block w-full p-4 border rounded-lg appearance-none hover:border-blue-500 transition-colors ${
                    formData.birthMonth ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <select
                  value={formData.birthDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDay: e.target.value }))}
                  className={`block w-full p-4 border rounded-lg appearance-none hover:border-blue-500 transition-colors ${
                    formData.birthDay ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Day</option>
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <select
                  value={formData.birthYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthYear: e.target.value }))}
                  className={`block w-full p-4 border rounded-lg appearance-none hover:border-blue-500 transition-colors ${
                    formData.birthYear ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Hometown Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Hometown
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('hometown')?.focus()}
                  className={`relative w-full p-4 text-left border rounded-lg hover:border-blue-500 transition-colors ${
                    formData.hometown ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <input
                    type="text"
                    id="hometown"
                    value={formData.hometown}
                    onChange={(e) => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
                    className="absolute inset-0 w-full h-full px-4 bg-transparent border-none focus:ring-0"
                    placeholder="Enter your hometown"
                  />
                </button>
              </div>
              {errors.hometown && (
                <p className="mt-1 text-sm text-red-600">{errors.hometown}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600"
            >
              Next
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 