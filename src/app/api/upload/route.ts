import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    // Check for required environment variables
    if (!process.env.FIREBASE_STORAGE_BUCKET) {
      console.error('FIREBASE_STORAGE_BUCKET is not set');
      throw new Error('FIREBASE_STORAGE_BUCKET is not set');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const fileName = `photos/${timestamp}-${file.name}`;
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;
    
    console.log('Uploading to bucket:', bucket);
    
    // Upload to Firebase Storage using REST API
    const uploadResponse = await fetch(
      `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?name=${fileName}&uploadType=media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
        },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      console.error('Error uploading to Firebase Storage:', error);
      throw new Error(`Failed to upload to Firebase Storage: ${error.error?.message || uploadResponse.statusText}`);
    }

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket}/${fileName}`;
    console.log('Upload successful, public URL:', publicUrl);

    return NextResponse.json({ url: publicUrl });
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