import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase/firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST() {
  try {
    // Create a test user
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      age: 30,
      gender: 'female',
      entrepreneurType: 'Tech Founder',
      businessStage: 'Seed',
      bio: 'Passionate about building innovative solutions',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const userRef = await addDoc(collection(db, 'users'), userData);

    // Create a test photo
    const photoData = {
      userId: userRef.id,
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop',
      createdAt: new Date(),
      isProfilePhoto: true
    };

    await addDoc(collection(db, 'photos'), photoData);

    // Create a test match
    const matchData = {
      user1Id: userRef.id,
      user2Id: 'another-user-id', // This would be replaced with a real user ID
      createdAt: new Date(),
      status: 'pending'
    };

    await addDoc(collection(db, 'matches'), matchData);

    // Create a test message
    const messageData = {
      fromUserId: userRef.id,
      toUserId: 'another-user-id', // This would be replaced with a real user ID
      content: 'Hello! Nice to meet you!',
      createdAt: new Date(),
      read: false
    };

    await addDoc(collection(db, 'messages'), messageData);

    return NextResponse.json({ 
      success: true, 
      message: 'Test data created successfully',
      userId: userRef.id 
    });
  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create test data' 
    }, { status: 500 });
  }
} 