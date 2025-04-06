'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

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

interface ProfileMessagesProps {
  userId: string;
  currentUserId: string;
}

export default function ProfileMessages({ userId, currentUserId }: ProfileMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: UserProfile }>({});
  const [sentMessagesLoaded, setSentMessagesLoaded] = useState(false);
  const [receivedMessagesLoaded, setReceivedMessagesLoaded] = useState(false);

  useEffect(() => {
    console.log('ProfileMessages mounted with:', { userId, currentUserId });
    
    // Query for both sent and received messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('fromUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const receivedMessagesQuery = query(
      collection(db, 'messages'),
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    console.log('Setting up messages listeners for queries:', { messagesQuery, receivedMessagesQuery });

    // Set up listeners for both sent and received messages
    const unsubscribeSent = onSnapshot(
      messagesQuery,
      async (snapshot) => {
        console.log('Sent messages snapshot received:', snapshot.size, 'messages');
        const sentMessages: Message[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isSent: true
        } as Message));
        
        console.log('Processed sent messages:', sentMessages);
        
        // Update messages state with sent messages
        setMessages(prev => {
          const receivedMessages = prev.filter(msg => !msg.isSent);
          const newMessages = [...sentMessages, ...receivedMessages].sort((a, b) => 
            b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime()
          );
          console.log('Updated messages state:', newMessages);
          return newMessages;
        });

        // Fetch recipient profiles
        const uniqueRecipientIds = Array.from(new Set(sentMessages.map(msg => msg.toUserId)));
        console.log('Fetching recipient profiles for:', uniqueRecipientIds);
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
        const receivedMessages: Message[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isSent: false
        } as Message));
        
        console.log('Processed received messages:', receivedMessages);
        
        // Update messages state with received messages
        setMessages(prev => {
          const sentMessages = prev.filter(msg => msg.isSent);
          const newMessages = [...sentMessages, ...receivedMessages].sort((a, b) => 
            b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime()
          );
          console.log('Updated messages state:', newMessages);
          return newMessages;
        });

        // Fetch sender profiles
        const uniqueSenderIds = Array.from(new Set(receivedMessages.map(msg => msg.fromUserId)));
        console.log('Fetching sender profiles for:', uniqueSenderIds);
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
  }, [userId, currentUserId]);

  useEffect(() => {
    // Only set loading to false when both queries have completed
    if (sentMessagesLoaded && receivedMessagesLoaded) {
      console.log('Both queries completed, setting loading to false');
      setLoading(false);
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

  if (loading) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {messages.map((message) => {
          const isSent = message.fromUserId === userId;
          const otherUserId = isSent ? message.toUserId : message.fromUserId;
          const otherUserProfile = userProfiles[otherUserId];
          
          console.log('Rendering message:', { message, isSent, otherUserProfile });
          
          return (
            <div 
              key={message.id} 
              className={`p-4 hover:bg-gray-50 ${isSent ? 'bg-purple-50' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <div className="relative h-10 w-10 flex-shrink-0">
                  {otherUserProfile?.photoURL || otherUserProfile?.photo || (otherUserProfile?.photos && otherUserProfile.photos[0]) ? (
                    <Image
                      src={otherUserProfile.photoURL || otherUserProfile.photo || otherUserProfile.photos![0]}
                      alt={otherUserProfile?.name || 'User'}
                      fill
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
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {isSent ? 'To: ' : 'From: '}{otherUserProfile?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {message.createdAt?.toDate().toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 