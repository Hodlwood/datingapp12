const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function generateStorageToken() {
  try {
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    // Generate a custom token
    const token = await admin.auth().createCustomToken('storage-service');
    console.log('Firebase Storage Token:', token);
    
    // Clean up
    await admin.app().delete();
  } catch (error) {
    console.error('Error generating token:', error);
    process.exit(1);
  }
}

generateStorageToken(); 