import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check for required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    return NextResponse.json({
      projectId: projectId || 'not set',
      clientEmail: clientEmail || 'not set',
      privateKey: privateKey ? 'set (not shown for security)' : 'not set',
      storageBucket: storageBucket || 'not set',
      message: 'Firebase Admin SDK configuration check completed'
    });
  } catch (error: any) {
    console.error('Error checking Firebase Admin SDK configuration:', error);
    return NextResponse.json(
      { error: 'Failed to check Firebase Admin SDK configuration', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 