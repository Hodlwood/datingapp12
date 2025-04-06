"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserChats } from '@/lib/firebase/firebaseUtils';
import { formatDistanceToNow } from 'date-fns';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export default function ChatListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadChats = async () => {
      try {
        const userChats = await getUserChats(user.uid);
        setChats(userChats);
        setLoading(false);
      } catch (error) {
        console.error('Error loading chats:', error);
        setLoading(false);
      }
    };

    loadChats();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <ChatBubbleLeftIcon className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No conversations yet</h2>
        <p className="text-gray-500 text-center mb-6">
          Start matching with other entrepreneurs to begin chatting!
        </p>
        <button
          onClick={() => router.push('/matches')}
          className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors"
        >
          Go to Matches
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="space-y-4">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => router.push(`/chat/${chat.id}`)}
            className="w-full flex items-center space-x-4 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600">
                {chat.otherUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 text-left">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{chat.otherUser.name}</h3>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(chat.lastMessageTime, { addSuffix: true })}
                </span>
              </div>
              <p className="text-gray-600 truncate">{chat.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 