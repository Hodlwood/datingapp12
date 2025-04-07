'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, limit, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import Image from 'next/image';
import Link from 'next/link';

interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: Timestamp;
  read: boolean;
}

interface User {
  id: string;
  name: string;
  photoURL?: string;
  photo?: string;
  photos?: string[];
}

export default function ChatPage({ params }: { params: { chatId: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const [userId1, userId2] = params.chatId.split('_');
    const otherUserId = userId1 === user.uid ? userId2 : userId1;

    const fetchOtherUser = async () => {
      try {
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
        if (otherUserDoc.exists()) {
          setOtherUser(otherUserDoc.data() as User);
        }
      } catch (err) {
        console.error('Error fetching other user:', err);
        setError('Failed to load user profile.');
      }
    };

    fetchOtherUser();

    // Query messages where both users are participants
    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const chatMessages = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message))
        .filter(msg => 
          (msg.fromUserId === user.uid && msg.toUserId === otherUserId) ||
          (msg.fromUserId === otherUserId && msg.toUserId === user.uid)
        )
        .sort((a, b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime());

      setMessages(chatMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, params.chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      const [userId1, userId2] = params.chatId.split('_');
      const otherUserId = userId1 === user.uid ? userId2 : userId1;

      const messageData = {
        fromUserId: user.uid,
        toUserId: otherUserId,
        content: newMessage.trim(),
        createdAt: Timestamp.now(),
        read: false,
        participants: [user.uid, otherUserId] // Add both users to participants array
      };

      await addDoc(collection(db, 'messages'), messageData);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view messages</h1>
          <Link href="/login" className="text-purple-600 hover:text-purple-800">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

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
          <p className="text-xl font-semibold mb-2">Error</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/messages" className="mr-4 text-gray-500 hover:text-gray-700">
                  ← Back to Messages
                </Link>
                <div className="flex items-center">
                  {/* Using optional chaining and nullish coalescing for safe access to user photos */}
                  {otherUser?.photoURL || otherUser?.photo || otherUser?.photos?.[0] ? (
                    <Image
                      src={otherUser?.photoURL || otherUser?.photo || (otherUser?.photos?.[0] ?? '')}
                      alt={otherUser?.name || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-lg">
                        {otherUser?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="ml-3 text-lg font-medium text-gray-900">
                    {otherUser?.name || 'Unknown User'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[calc(100vh-16rem)] overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.fromUserId === user.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.fromUserId === user.uid
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {message.createdAt.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 