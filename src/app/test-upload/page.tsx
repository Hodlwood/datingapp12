'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { storage } from '@/lib/firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

export default function TestUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const { user } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setError('');
      setPreviewUrl(URL.createObjectURL(file));

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const path = `test-uploads/${user.uid}/${filename}`;

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
      setUploadedUrl(downloadURL);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Test Photo Upload</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {uploading && (
            <div className="mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {previewUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
                <div className="relative aspect-square">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              </div>
            )}

            {uploadedUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded</h3>
                <div className="relative aspect-square">
                  <Image
                    src={uploadedUrl}
                    alt="Uploaded"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 