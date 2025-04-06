import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size should be less than 5MB' },
        { status: 400 }
      );
    }

    try {
      // Create a unique filename with extension
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `users/${userId}/photos/${filename}`);

      // Convert File to ArrayBuffer
      const bytes = await file.arrayBuffer();
      const buffer = new Uint8Array(bytes);

      // Set up metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        }
      };

      // Upload file
      const snapshot = await uploadBytes(storageRef, buffer, metadata);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return NextResponse.json({ url: downloadURL });
    } catch (uploadError: any) {
      console.error('Firebase upload error:', {
        code: uploadError.code,
        message: uploadError.message,
        serverResponse: uploadError.serverResponse
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to upload to Firebase Storage',
          details: uploadError.message,
          code: uploadError.code
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process upload request',
        details: error.message
      },
      { status: 500 }
    );
  }
} 