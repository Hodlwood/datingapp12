import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function getFirebaseAccessToken() {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v4/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    }
  );

  const data = await response.json();
  return data.access_token;
}

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

    const buffer = await file.arrayBuffer();
    const fileName = `${uuidv4()}-${file.name}`;
    const bucket = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    
    // Get Firebase access token
    const accessToken = await getFirebaseAccessToken();
    
    // Upload to Firebase Storage using REST API
    const uploadResponse = await fetch(
      `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?name=${fileName}&uploadType=media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': file.type,
        },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to Firebase Storage');
    }

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
} 