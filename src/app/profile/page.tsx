'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/firebase';
import { uploadProfilePicture } from '@/lib/firebase/firebaseUtils';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PencilIcon, PlusIcon, XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ProfileData {
  name: string;
  gender: string;
  interestedIn: string;
  age: number;
  ageRangePreference: {
    min: number;
    max: number;
  };
  location: string;
  entrepreneurType: string;
  businessStage: string;
  lookingFor: string[];
  interests: string[];
  relationshipGoals: string;
  bio: string;
  photos: string[];
  onboardingCompleted?: boolean;
  messages?: {
    id: string;
    senderId: string;
    senderName: string;
    senderPhoto: string;
    lastMessage: string;
    timestamp: Date;
    unread: boolean;
  }[];
  photoURL?: string;
}

interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: any;
  read: boolean;
  isSent?: boolean;
}

interface UserProfile {
  name: string;
  photoURL?: string;
  photo?: string;
  photos?: string[];
}

interface Conversation {
  userId: string;
  messages: Message[];
  userProfile: UserProfile;
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: UserProfile }>({});
  const [sentMessagesLoaded, setSentMessagesLoaded] = useState(false);
  const [receivedMessagesLoaded, setReceivedMessagesLoaded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isEditing, setIsEditing] = useState({ about: false });
  const [nameInput, setNameInput] = useState('');
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setProfileData(userDoc.data() as ProfileData);
        } else {
          setError('Profile not found');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchProfileData();
      // Set up auto-refresh every 30 seconds
      const refreshInterval = setInterval(fetchProfileData, 30000);
      return () => clearInterval(refreshInterval);
    }
  }, [user, authLoading]);

  // Check authentication status
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signup');
    } else if (user && profileData && !profileData.onboardingCompleted) {
      router.push('/onboarding');
    }
  }, [user, authLoading, router, profileData]);

  useEffect(() => {
    if (!user) return;

    console.log('Setting up message listeners for user:', user.uid);
    
    // Query for both sent and received messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('fromUserId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const receivedMessagesQuery = query(
      collection(db, 'messages'),
      where('toUserId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Set up listeners for both sent and received messages
    const unsubscribeSent = onSnapshot(
      messagesQuery,
      async (snapshot) => {
        console.log('Sent messages snapshot received:', snapshot.size, 'messages');
        const sentMessages: Message[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isSent: true
          } as Message;
        });
        
        // Update messages state with sent messages
        setMessages(prev => {
          const receivedMessages = prev.filter(msg => !msg.isSent);
          return [...sentMessages, ...receivedMessages].sort((a, b) => 
            b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime()
          );
        });

        // Fetch recipient profiles
        const uniqueRecipientIds = Array.from(new Set(sentMessages.map(msg => msg.toUserId)));
        await fetchUserProfiles(uniqueRecipientIds);
        setSentMessagesLoaded(true);
      },
      (error) => {
        console.error('Error in sent messages listener:', error);
        setError('Failed to load sent messages');
        setSentMessagesLoaded(true);
      }
    );

    const unsubscribeReceived = onSnapshot(
      receivedMessagesQuery,
      async (snapshot) => {
        console.log('Received messages snapshot received:', snapshot.size, 'messages');
        const receivedMessages: Message[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isSent: false
          } as Message;
        });
        
        // Update messages state with received messages
        setMessages(prev => {
          const sentMessages = prev.filter(msg => msg.isSent);
          return [...sentMessages, ...receivedMessages].sort((a, b) => 
            b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime()
          );
        });

        // Fetch sender profiles
        const uniqueSenderIds = Array.from(new Set(receivedMessages.map(msg => msg.fromUserId)));
        await fetchUserProfiles(uniqueSenderIds);
        setReceivedMessagesLoaded(true);
      },
      (error) => {
        console.error('Error in received messages listener:', error);
        setError('Failed to load received messages');
        setReceivedMessagesLoaded(true);
      }
    );

    return () => {
      console.log('Cleaning up messages listeners');
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [user]);

  // New useEffect to group messages into conversations
  useEffect(() => {
    if (!messages.length || !user) return;

    // Group messages by conversation
    const groupedMessages = messages.reduce((acc: { [key: string]: Message[] }, message) => {
      const otherUserId = message.fromUserId === user.uid ? message.toUserId : message.fromUserId;
      if (!acc[otherUserId]) {
        acc[otherUserId] = [];
      }
      acc[otherUserId].push(message);
      return acc;
    }, {});

    // Convert grouped messages to conversations
    const conversationsList = Object.entries(groupedMessages).map(([userId, messages]) => ({
      userId,
      messages: messages.sort((a, b) => b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime()),
      userProfile: userProfiles[userId] || { name: 'Unknown User' }
    }));

    setConversations(conversationsList);
  }, [messages, userProfiles, user]);

  useEffect(() => {
    // Only set loading to false when both queries have completed
    if (sentMessagesLoaded && receivedMessagesLoaded) {
      console.log('Both queries completed, setting loading to false');
      setLoadingMessages(false);
    }
  }, [sentMessagesLoaded, receivedMessagesLoaded]);

  const fetchUserProfiles = async (userIds: string[]) => {
    const profiles: { [key: string]: UserProfile } = {};
    for (const uid of userIds) {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User profile data:', { uid, userData });
          profiles[uid] = {
            name: userData.name || 'Unknown User',
            photoURL: userData.photoURL,
            photo: userData.photo,
            photos: userData.photos
          };
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    }
    setUserProfiles(prev => ({ ...prev, ...profiles }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setError('');

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.uid);

      // Upload using the API route
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload photo');
      }

      const { url: downloadURL } = await response.json();

      // Update Firestore document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        photos: arrayUnion(downloadURL),
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setProfileData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          photos: [...(prev.photos || []), downloadURL],
          photoURL: downloadURL
        };
      });

      // Show success message
      setError('');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (indexToRemove: number) => {
    if (!user || !profileData) return;

    try {
      const photoUrl = profileData.photos[indexToRemove];
      const userRef = doc(db, 'users', user.uid);
      
      // Remove the photo URL from Firestore
      await updateDoc(userRef, {
        photos: arrayRemove(photoUrl)
      });

      // Update local state
      setProfileData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          photos: prev.photos.filter((_, index) => index !== indexToRemove)
        };
      });
    } catch (error) {
      console.error('Error removing photo:', error);
      setError('Failed to remove photo');
    }
  };

  const handleEditProfile = () => {
    // Store current profile data in localStorage for pre-filling onboarding form
    if (profileData) {
      localStorage.setItem('profileData', JSON.stringify(profileData));
      router.push('/onboarding');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        read: true
      });
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleInputChange = async (field: string, value: string) => {
    if (!user) return;

    try {
      // Update local state immediately for responsive UI
      setProfileData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [field]: value
        };
      });

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user || !profileData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className={`shadow pt-16 ${
          profileData.gender === 'male' 
            ? 'bg-gradient-to-r from-blue-50 to-blue-100' 
            : 'bg-gradient-to-r from-pink-50 to-pink-100'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative h-24 w-24 rounded-full overflow-hidden">
                  {profileData?.photos && profileData.photos.length > 0 ? (
                    <Image
                      src={profileData.photos[0]}
                      alt="Profile"
                      fill
                      sizes="(max-width: 768px) 96px, 96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">
                        {profileData?.gender === 'male' ? '👨' : '👩'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profileData?.name}
                  </h1>
                  <p className="text-gray-700">
                    {profileData?.age} years old • {profileData?.location}
                  </p>
                </div>
              </div>
              <button
                onClick={handleEditProfile}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-5 w-5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="mt-8 px-8 pb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Side: Photos and Messages */}
            <div className="w-full md:w-5/12 space-y-6">
              {/* Name Input Box */}
              <div className="bg-white rounded-lg shadow p-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                  <button
                    onClick={() => {
                      if (nameInput.trim()) {
                        handleInputChange('name', nameInput.trim());
                        setNameInput('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Photo Upload Grid */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {profileData?.photos?.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {(!profileData?.photos || profileData.photos.length < 6) && (
                    <div className="relative aspect-square">
                      <label className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Click on a box to upload a photo. Maximum 6 photos allowed. Images should be less than 5MB.
                </p>
              </div>

              {/* Messages Section - Temporarily Hidden
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Messages</h2>
                {loadingMessages ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No messages yet</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isSent = message.fromUserId === user?.uid;
                      const otherUserId = isSent ? message.toUserId : message.fromUserId;
                      const otherUserProfile = userProfiles[otherUserId];
                      
                      return (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg border ${
                            !message.read ? 'bg-purple-50' : 'bg-white'
                          } ${isSent ? 'border-purple-200' : 'border-gray-200'}`}
                          onClick={() => handleMarkAsRead(message.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-3">
                              <div className="relative h-10 w-10 flex-shrink-0">
                                {otherUserProfile?.photoURL || otherUserProfile?.photo || otherUserProfile?.photos?.[0] ? (
                                  <Image
                                    src={otherUserProfile.photoURL || otherUserProfile.photo || otherUserProfile.photos?.[0] || ''}
                                    alt={otherUserProfile?.name || 'User'}
                                    fill
                                    sizes="40px"
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-lg">
                                      {(otherUserProfile?.name || 'U').charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {isSent ? 'To: ' : 'From: '}{otherUserProfile?.name || 'Unknown User'}
                                </p>
                                <p className="text-gray-600 mt-1">{message.content}</p>
                                <p className="text-sm text-gray-500 mt-2">
                                  {message.createdAt?.toDate().toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              */}
            </div>

            {/* Right Side: User Info */}
            <div className="w-full md:w-7/12 space-y-6">
              {/* About */}
              <div className="bg-white rounded-lg shadow p-6 ml-12">
                <div className="flex flex-col items-end">
                  <h2 className={`inline-block px-4 py-1 rounded-full text-xl font-semibold mb-4 text-gray-900 ${
                    profileData.gender === 'male' 
                      ? 'bg-blue-100' 
                      : 'bg-pink-100'
                  }`}>About</h2>
                  <p className="text-gray-600 text-right">{profileData.bio}</p>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white rounded-lg shadow p-6 ml-12">
                <div className="flex flex-col items-end">
                  <h2 className="inline-block px-4 py-1 rounded-full text-xl font-semibold mb-4 bg-purple-100 text-gray-900">Preferences</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 text-right">Interested In</h3>
                      <p className="mt-1 text-gray-900 capitalize text-right">{profileData.interestedIn}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 text-right">Age Range</h3>
                      <p className="mt-1 text-gray-900 text-right">
                        {profileData.ageRangePreference?.min || 18} - {profileData.ageRangePreference?.max || 65} years
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entrepreneur Info */}
              <div className="bg-white rounded-lg shadow p-6 ml-12">
                <div className="flex flex-col items-end">
                  <h2 className="inline-block px-4 py-1 rounded-full text-xl font-semibold mb-4 bg-green-100 text-gray-900">Entrepreneur Profile</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 text-right">Type</h3>
                      <p className="mt-1 text-gray-900 capitalize text-right">{profileData.entrepreneurType}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 text-right">Business Stage</h3>
                      <p className="mt-1 text-gray-900 capitalize text-right">{profileData.businessStage}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Looking For */}
              <div className="bg-white rounded-lg shadow p-6 ml-12">
                <div className="flex flex-col items-end">
                  <h2 className="inline-block px-4 py-1 rounded-full text-xl font-semibold mb-4 bg-orange-100 text-gray-900">Looking For</h2>
                  <div className="mt-4 flex flex-wrap gap-2 justify-end">
                    {profileData.lookingFor.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="bg-white rounded-lg shadow p-6 ml-12">
                <div className="flex flex-col items-end">
                  <h2 className="inline-block px-4 py-1 rounded-full text-xl font-semibold mb-4 bg-teal-100 text-gray-900">Interests</h2>
                  <div className="mt-4 flex flex-wrap gap-2 justify-end">
                    {profileData.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Relationship Goals */}
              <div className="bg-white rounded-lg shadow p-6 ml-12">
                <div className="flex flex-col items-end">
                  <h2 className="inline-block px-4 py-1 rounded-full text-xl font-semibold mb-4 bg-indigo-100 text-gray-900">Relationship Goals</h2>
                  <div className="mt-4">
                    <p className="text-gray-900 text-right">{profileData.relationshipGoals}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 