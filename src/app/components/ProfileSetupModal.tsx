'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface ProfileSetupModalProps {
  isOpen: boolean;
  initialData: {
    gender: string;
    interestedIn: string;
  };
}

export default function ProfileSetupModal({ isOpen, initialData }: ProfileSetupModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    dateOfBirth: '',
    hometown: '',
  });
  const [errors, setErrors] = useState({
    displayName: '',
    dateOfBirth: '',
    hometown: '',
  });

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

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
      isValid = false;
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
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

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setIsSubmitting(true);
    try {
      const birthDate = new Date(formData.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      await setDoc(doc(db, 'users', user.uid), {
        ...initialData,
        ...formData,
        age,
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardingStep: 'entrepreneur', // Next step in the onboarding process
      });

      router.push('/onboarding/entrepreneur');
    } catch (error) {
      console.error('Error saving profile data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="text-center">
                    <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900 mb-8">
                      More About You
                    </Dialog.Title>
                  </div>

                  <div className="space-y-6">
                    {/* Name Input */}
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                        Your Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="displayName"
                          value={formData.displayName}
                          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter your name"
                        />
                        {errors.displayName && (
                          <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
                        )}
                      </div>
                    </div>

                    {/* Date of Birth Input */}
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          id="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        {errors.dateOfBirth && (
                          <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                        )}
                      </div>
                    </div>

                    {/* Hometown Input */}
                    <div>
                      <label htmlFor="hometown" className="block text-sm font-medium text-gray-700">
                        Hometown
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="hometown"
                          value={formData.hometown}
                          onChange={(e) => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter your hometown"
                        />
                        {errors.hometown && (
                          <p className="mt-1 text-sm text-red-600">{errors.hometown}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600'
                    }`}
                  >
                    {isSubmitting ? 'Saving...' : 'Continue'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 