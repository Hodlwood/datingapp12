"use client";

import { XMarkIcon } from '@heroicons/react/24/outline';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    url: string;
    type: string;
    name?: string;
  };
}

export default function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
  if (!isOpen) return null;

  const isImage = file.type.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative bg-white rounded-lg max-w-4xl w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <div className="p-4">
          {isImage ? (
            <img
              src={file.url}
              alt="Preview"
              className="max-h-[80vh] w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-gray-500">
                  {getFileIcon(file.type)}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{file.name || 'Document'}</h3>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel')) return '📊';
  if (fileType.includes('text')) return '��';
  return '📁';
} 