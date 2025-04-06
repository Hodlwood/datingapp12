import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Get the storage instance
const storageAdmin = getStorage();
const bucketName = 'loveentrepreneurs-7c8a9.firebasestorage.app';
console.log('Attempting to access bucket:', bucketName);

const bucket = storageAdmin.bucket(bucketName);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    
    // Upload to Firebase Storage
    const fileRef = bucket.file(`photos/${filename}`);
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });
    
    // Get the download URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Upload error details:', {
      message: error?.message || 'Unknown error',
      code: error?.code || 'unknown',
      stack: error?.stack || 'No stack trace'
    });
    return NextResponse.json(
      { error: 'Failed to upload file', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 