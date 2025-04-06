'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  location: string;
  occupation: string;
  interests: string[];
  lookingFor: string;
  photoURL?: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;

      try {
        // Get current user's profile
        const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', user.uid)));
        const userProfile = userDoc.docs[0].data() as User;

        // Get potential matches based on preferences
        const matchesQuery = query(
          collection(db, 'users'),
          where('id', '!=', user.uid),
          where('gender', '==', userProfile.lookingFor),
          where('onboardingCompleted', '==', true)
        );

        const matchesSnapshot = await getDocs(matchesQuery);
        const potentialMatches = matchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];

        // Filter matches based on interests and location
        const filteredMatches = potentialMatches.filter(match => {
          const hasCommonInterests = match.interests.some(interest =>
            userProfile.interests.includes(interest)
          );
          const isInSameLocation = match.location === userProfile.location;
          return hasCommonInterests && isInSameLocation;
        });

        setMatches(filteredMatches);
      } catch (err) {
        setError('Failed to fetch matches. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user]);

  const handleLike = async (matchId: string) => {
    if (!user) return;

    try {
      // Update current user's likes
      await updateDoc(doc(db, 'users', user.uid), {
        likes: arrayUnion(matchId)
      });

      // Check if it's a mutual match
      const matchDoc = await getDocs(query(collection(db, 'users'), where('id', '==', matchId)));
      const matchData = matchDoc.docs[0].data();
      
      if (matchData.likes?.includes(user.uid)) {
        // Create a match
        await updateDoc(doc(db, 'users', user.uid), {
          matches: arrayUnion(matchId)
        });
        await updateDoc(doc(db, 'users', matchId), {
          matches: arrayUnion(user.uid)
        });
      }
    } catch (err) {
      setError('Failed to process like. Please try again.');
    }
  };

  const handlePass = async (matchId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        passes: arrayUnion(matchId)
      });
    } catch (err) {
      setError('Failed to process pass. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No matches found</h2>
          <p className="mt-2 text-gray-600">Try adjusting your preferences to find more matches.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Potential Matches
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-48">
                {match.photoURL ? (
                  <Image
                    src={match.photoURL}
                    alt={match.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No photo</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {match.name}, {match.age}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{match.occupation}</p>
                <p className="mt-2 text-gray-700">{match.bio}</p>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">Interests</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {match.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={() => handlePass(match.id)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => handleLike(match.id)}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Like
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 