'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getMutualMatches } from '@/lib/firebase/firebaseUtils';

interface MutualMatch {
  id: string;
  name: string;
  age: number;
  company: string;
  role: string;
  bio: string;
  interests: string[];
  location: string;
}

export default function MutualMatchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MutualMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMutualMatches = async () => {
      if (!user) {
        router.push('/signin');
        return;
      }

      try {
        const mutualMatches = await getMutualMatches(user.uid);
        setMatches(mutualMatches);
      } catch (err) {
        setError('Failed to load mutual matches');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMutualMatches();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading mutual matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Matches</h1>
          <p className="mt-2 text-gray-600">
            {matches.length === 0
              ? "You haven't matched with anyone yet"
              : `You have ${matches.length} mutual match${matches.length === 1 ? '' : 'es'}`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{match.name}</h2>
                  <p className="text-gray-600">{match.age} years old</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500">Work</h3>
                    <p className="text-gray-900">
                      {match.role} at {match.company}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500">Location</h3>
                    <p className="text-gray-900">{match.location}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500">About</h3>
                    <p className="text-gray-900 line-clamp-2">{match.bio}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500">Interests</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {match.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => router.push(`/chat/${match.id}`)}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Start Chat
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