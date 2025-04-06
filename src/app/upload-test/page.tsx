'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function UploadTestPage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

  const validateFile = (file: File) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    return true;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.uid) {
      setError('Please sign in to upload photos.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Validate file
      validateFile(file);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.uid);

      // Upload using our API route
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      console.log('Upload successful, URL:', data.url);
      
      setImageUrl(data.url);
      setError('');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Photo Upload Test</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select a photo (max 5MB)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {uploading && (
            <div className="text-sm text-gray-500">
              Uploading...
            </div>
          )}

          {imageUrl && (
            <div className="mt-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Uploaded Image:</h2>
              <div className="relative w-full h-64">
                <Image
                  src={imageUrl}
                  alt="Uploaded photo"
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 