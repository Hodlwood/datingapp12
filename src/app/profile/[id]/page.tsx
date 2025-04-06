'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import ProfileMessages from '@/app/components/ProfileMessages';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import Image from 'next/image';

interface ProfilePageProps {
  params: {
    id: string;
  };
}

interface UserProfile {
  name: string;
  bio: string;
  age: number;
  location: string;
  entrepreneurType: string;
  businessStage: string;
  photoURL?: string;
  photo?: string;
  photos?: string[];
  interests?: string[];
  lookingFor?: string[];
  relationshipGoals?: string;
  interestedIn?: string;
  gender?: string;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Profile page mounted with:', { params, user });
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, 'users', params.id);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error loading profile</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <p className="text-xl font-semibold">Profile not found</p>
        </div>
      </div>
    );
  }

  console.log('Rendering profile page with:', { user, profile });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-start space-x-6">
              <div className="relative h-32 w-32 flex-shrink-0">
                {profile.photoURL || profile.photo || (profile.photos && profile.photos[0]) ? (
                  <Image
                    src={profile.photoURL || profile.photo || profile.photos![0]}
                    alt={profile.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-4xl">
                      {profile.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="mt-1 text-gray-500">{profile.age} years old</p>
                <p className="mt-1 text-gray-500">{profile.location}</p>
                <div className="mt-4">
                  <h2 className="text-lg font-semibold text-gray-900">About</h2>
                  <p className="mt-1 text-gray-600">{profile.bio}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Entrepreneur Type</h3>
                    <p className="mt-1 text-sm text-gray-900">{profile.entrepreneurType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Business Stage</h3>
                    <p className="mt-1 text-sm text-gray-900">{profile.businessStage}</p>
                  </div>
                  {profile.interests && profile.interests.length > 0 && (
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium text-gray-500">Interests</h3>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {profile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Section */}
        {user && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
            <ProfileMessages 
              userId={user.uid} 
              currentUserId={user.uid} 
            />
          </div>
        )}
      </div>
    </div>
  );
} 