'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function EntrepreneurOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    entrepreneurType: '',
    businessStage: '',
    industry: '',
  });

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

  // Set initial gender from URL parameter
  useEffect(() => {
    const gender = searchParams.get('gender');
    console.log('Received gender:', gender);
    if (!gender) {
      console.log('No gender found, redirecting to home');
      router.push('/');
    }
  }, [searchParams, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    // Store the form data in localStorage
    localStorage.setItem('entrepreneurData', JSON.stringify(formData));
    
    // Move to the personal preferences page
    router.push('/onboarding/personal');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Tell Us About Your Entrepreneurial Journey
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Entrepreneur Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {entrepreneurTypes.map((type) => (
                  <motion.button
                    key={type}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, entrepreneurType: type }))}
                    className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                      formData.entrepreneurType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {type}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Business Stage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                My business is in...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {businessStages.map((stage) => (
                  <motion.button
                    key={stage}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, businessStage: stage }))}
                    className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                      formData.businessStage === stage
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {stage}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                My industry is...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {industries.map((industry) => (
                  <motion.button
                    key={industry}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, industry }))}
                    className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                      formData.industry === industry
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {industry}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!formData.entrepreneurType || !formData.businessStage || !formData.industry}
                className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
                  formData.entrepreneurType && formData.businessStage && formData.industry
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Continue
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 