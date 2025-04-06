'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function TestSetup() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const runTests = async () => {
    try {
      setStatus('Running tests...');
      const results: any = {};

      // Test 1: Create a test user document
      if (user) {
        const userData = {
          name: 'Test User',
          email: user.email,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const userRef = await addDoc(collection(db, 'users'), userData);
        results.userCreated = userRef.id;
      }

      // Test 2: Create a test photo
      const photoData = {
        userId: user?.uid,
        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop',
        createdAt: new Date(),
        isProfilePhoto: true
      };
      const photoRef = await addDoc(collection(db, 'photos'), photoData);
      results.photoCreated = photoRef.id;

      // Test 3: Create a test match
      const matchData = {
        user1Id: user?.uid,
        user2Id: 'test-user-2',
        createdAt: new Date(),
        status: 'pending'
      };
      const matchRef = await addDoc(collection(db, 'matches'), matchData);
      results.matchCreated = matchRef.id;

      // Test 4: Create a test message
      const messageData = {
        fromUserId: user?.uid,
        toUserId: 'test-user-2',
        content: 'Hello! This is a test message.',
        createdAt: new Date(),
        read: false
      };
      const messageRef = await addDoc(collection(db, 'messages'), messageData);
      results.messageCreated = messageRef.id;

      // Test 5: Read all collections
      const collections = ['users', 'photos', 'matches', 'messages'];
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        results[`${collectionName}Count`] = snapshot.size;
      }

      setTestResults(results);
      setStatus('Tests completed successfully!');
    } catch (error) {
      console.error('Test error:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Firebase Setup Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">Current User: {user.email}</p>
            <p className="text-sm text-gray-600">User ID: {user.uid}</p>
          </div>

          <button
            onClick={runTests}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Run Tests
          </button>

          {status && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <p className="font-medium">Status: {status}</p>
            </div>
          )}

          {testResults && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 