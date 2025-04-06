"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
import { compressImage } from '@/lib/utils/imageCompression';
import ImageCropper from './ImageCropper';

interface ProfilePictureProps {
  imageUrl?: string;
  onImageUpdate: (file: File) => Promise<string>;
  onImageDelete: () => Promise<void>;
}

export default function ProfilePicture({ imageUrl, onImageUpdate, onImageDelete }: ProfilePictureProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(imageUrl);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Create URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
  };

  const handleCropComplete = async (croppedFile: File) => {
    try {
      setIsUploading(true);

      // Compress the cropped image
      const compressed = await compressImage(croppedFile, 800, 800, 0.8);
      
      // Upload and get final URL
      const uploadedUrl = await onImageUpdate(compressed.file);
      setPreviewUrl(uploadedUrl);

      // Cleanup
      setCropperImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
      // Revert to previous image on error
      setPreviewUrl(imageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!previewUrl) return;
    
    if (confirm('Are you sure you want to delete your profile picture?')) {
      try {
        setIsDeleting(true);
        await onImageDelete();
        setPreviewUrl(undefined);
      } catch (error) {
        console.error('Error deleting profile picture:', error);
        alert('Failed to delete profile picture. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div className="relative w-32 h-32 mx-auto group">
        {/* Profile Picture */}
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              {/* Delete overlay - shows on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-white p-2 rounded-full hover:bg-red-500 transition-colors"
                >
                  {isDeleting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <TrashIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-gray-400">
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <label
          htmlFor="profile-picture"
          className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors"
        >
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CameraIcon className="w-6 h-6" />
          )}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          id="profile-picture"
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
          disabled={isUploading || isDeleting}
        />
      </div>

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          imageUrl={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropperImage(null);
            resetFileInput();
          }}
          aspectRatio={1}
        />
      )}
    </>
  );
} 