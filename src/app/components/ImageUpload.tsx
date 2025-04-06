'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { uploadProfilePicture } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/hooks/useAuth';

interface ImageUploadProps {
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  maxSize?: number; // in bytes
  aspectRatio?: number; // width/height
}

export default function ImageUpload({
  onUploadComplete,
  onUploadError,
  maxSize = 5 * 1024 * 1024, // 5MB default
  aspectRatio = 1, // square default
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    
    if (!user) {
      const error = new Error('Authentication required');
      console.error('Upload failed:', error);
      setError('Please sign in to upload images');
      onUploadError?.(error);
      return;
    }

    const file = acceptedFiles[0];
    console.log('Starting upload for file:', file.name, 'Size:', file.size);
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    setError(null);

    try {
      console.log('Calling uploadProfilePicture with userId:', user.uid);
      const url = await uploadProfilePicture(user.uid, file);
      console.log('Upload successful, URL:', url);
      onUploadComplete?.(url);
    } catch (error) {
      console.error('Detailed upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setError(errorMessage);
      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsUploading(false);
    }
  }, [user, onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize,
    multiple: false
  });

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p className="font-medium">Upload Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-4
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200
        `}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="relative w-full" style={{ paddingTop: `${(1 / aspectRatio) * 100}%` }}>
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                <span className="mt-2 text-white">Uploading...</span>
                <span className="text-xs text-white mt-1">Please don't close this window</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4 flex text-sm text-gray-600">
              <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                <span>Upload a file</span>
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 