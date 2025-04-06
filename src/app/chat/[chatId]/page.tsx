"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/app/components/ChatInterface';
import { getUserProfile } from '@/lib/firebase/firebaseUtils';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ChatPage() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadChat = async () => {
      try {
        // Get chat document
        const chatRef = doc(db, 'chats', chatId as string);
        const chatSnap = await getDoc(chatRef);
        
        if (!chatSnap.exists()) {
          throw new Error('Chat not found');
        }

        const chatData = chatSnap.data();
        const otherUserId = chatData.participants.find((id: string) => id !== user.uid);
        
        if (!otherUserId) {
          throw new Error('Other user not found');
        }

        // Get other user's profile
        const otherUserProfile = await getUserProfile(otherUserId);
        if (!otherUserProfile) {
          throw new Error('Other user profile not found');
        }

        setOtherUser({
          id: otherUserId,
          ...otherUserProfile
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading chat:', error);
        router.push('/matches');
      }
    };

    loadChat();
  }, [user, chatId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Chat not found</p>
      </div>
    );
  }

  return (
    <ChatInterface
      chatId={chatId as string}
      otherUserId={otherUser.id}
      otherUserName={otherUser.name}
    />
  );
} 