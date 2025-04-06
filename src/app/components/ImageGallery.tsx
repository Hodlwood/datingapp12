"use client";

import { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ImageGalleryProps {
  images: { url: string; timestamp: Date }[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageGallery({ images, initialIndex = 0, onClose }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>

      {/* Navigation buttons */}
      <button
        onClick={handlePrevious}
        className="absolute left-4 text-white hover:text-gray-300 p-2"
      >
        <ChevronLeftIcon className="w-8 h-8" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 text-white hover:text-gray-300 p-2"
      >
        <ChevronRightIcon className="w-8 h-8" />
      </button>

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <img
          src={images[currentIndex].url}
          alt={`Image ${currentIndex + 1}`}
          className={`max-w-full max-h-[90vh] object-contain transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Image counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Timestamp */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {images[currentIndex].timestamp.toLocaleString()}
        </div>
      </div>
    </div>
  );
} 