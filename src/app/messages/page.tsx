'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { signOut, getAuth } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';

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
  id: string;
  otherUserId: string;
  otherUserProfile: UserProfile;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: UserProfile }>({});
  const [sentMessagesLoaded, setSentMessagesLoaded] = useState(false);
  const [receivedMessagesLoaded, setReceivedMessagesLoaded] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up message listeners for user:', user.uid);
    
    // Query for all messages where user is either sender or receiver
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
            getMessageTimestamp(b).getTime() - getMessageTimestamp(a).getTime()
          );
        });

        // Fetch recipient profiles
        const uniqueRecipientIds = Array.from(new Set(sentMessages.map(msg => msg.toUserId)));
        await fetchUserProfiles(uniqueRecipientIds);
        setSentMessagesLoaded(true);
      },
      (error) => {
        console.error('Error in sent messages listener:', error);
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
            getMessageTimestamp(b).getTime() - getMessageTimestamp(a).getTime()
          );
        });

        // Fetch sender profiles
        const uniqueSenderIds = Array.from(new Set(receivedMessages.map(msg => msg.fromUserId)));
        await fetchUserProfiles(uniqueSenderIds);
        setReceivedMessagesLoaded(true);
      },
      (error) => {
        console.error('Error in received messages listener:', error);
        setReceivedMessagesLoaded(true);
      }
    );

    return () => {
      console.log('Cleaning up messages listeners');
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [user]);

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

  useEffect(() => {
    if (!messages.length) return;

    const groupedMessages: { [key: string]: Message[] } = {};
    messages.forEach(message => {
      const otherUserId = message.fromUserId === user?.uid ? message.toUserId : message.fromUserId;
      if (!groupedMessages[otherUserId]) {
        groupedMessages[otherUserId] = [];
      }
      groupedMessages[otherUserId].push(message);
    });

    const conversationList: Conversation[] = Object.entries(groupedMessages).map(([otherUserId, messages]) => {
      const sortedMessages = messages.sort((a, b) => 
        getMessageTimestamp(b).getTime() - getMessageTimestamp(a).getTime()
      );
      // Only count unread messages for received messages
      const unreadCount = messages.filter(m => !m.read && m.toUserId === user?.uid).length;
      
      return {
        id: otherUserId,
        otherUserId,
        otherUserProfile: userProfiles[otherUserId] || { name: 'Unknown User' },
        messages: sortedMessages,
        lastMessage: sortedMessages[0],
        unreadCount
      };
    });

    // Sort conversations by last message time
    conversationList.sort((a, b) => 
      getMessageTimestamp(b.lastMessage).getTime() - getMessageTimestamp(a.lastMessage).getTime()
    );

    setConversations(conversationList);

    // Update selected conversation if it exists
    if (selectedConversation) {
      const updatedConversation = conversationList.find(c => c.id === selectedConversation.id);
      if (updatedConversation) {
        setSelectedConversation(updatedConversation);
      }
    }
  }, [messages, userProfiles, user?.uid, selectedConversation?.id]);

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      // Create the message document
      const messageData = {
        fromUserId: user.uid,
        toUserId: selectedConversation.otherUserId,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
        read: false
      };

      // Add the message to Firestore
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, messageData);

      // Clear the input
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Helper function to safely get timestamp
  const getMessageTimestamp = (message: Message) => {
    if (message.createdAt?.toDate) {
      return message.createdAt.toDate();
    }
    return message.createdAt instanceof Date ? message.createdAt : new Date();
  };

  if (authLoading || loadingMessages) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/signup');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Messages Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No messages yet</p>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    conversation.unreadCount > 0 ? 'bg-purple-50 hover:bg-purple-100' : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className="relative h-10 w-10 flex-shrink-0">
                        {conversation.otherUserProfile?.photoURL || conversation.otherUserProfile?.photo || (conversation.otherUserProfile?.photos && conversation.otherUserProfile.photos[0]) ? (
                          <Image
                            src={conversation.otherUserProfile.photoURL || conversation.otherUserProfile.photo || (conversation.otherUserProfile.photos?.[0] || '')}
                            alt={conversation.otherUserProfile?.name || 'User'}
                            fill
                            sizes="40px"
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-lg">
                              {(conversation.otherUserProfile?.name || 'U').charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">
                            {conversation.otherUserProfile?.name || 'Unknown User'}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              {conversation.unreadCount} new
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1 line-clamp-1">{conversation.lastMessage.content}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {getMessageTimestamp(conversation.lastMessage).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Conversation Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative h-10 w-10">
                  {selectedConversation.otherUserProfile?.photoURL || selectedConversation.otherUserProfile?.photo || (selectedConversation.otherUserProfile?.photos && selectedConversation.otherUserProfile.photos[0]) ? (
                    <Image
                      src={selectedConversation.otherUserProfile.photoURL || selectedConversation.otherUserProfile.photo || (selectedConversation.otherUserProfile.photos?.[0] || '')}
                      alt={selectedConversation.otherUserProfile?.name || 'User'}
                      fill
                      sizes="40px"
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-lg">
                        {(selectedConversation.otherUserProfile?.name || 'U').charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-semibold">
                  {selectedConversation.otherUserProfile?.name || 'Unknown User'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedConversation.messages.map((message) => {
                const isSent = message.fromUserId === user?.uid;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSent ? 'justify-start' : 'justify-end'} mb-2`}
                  >
                    <div
                      className={`max-w-[45%] rounded-lg p-2.5 ${
                        isSent
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-0.5 ${isSent ? 'text-blue-100' : 'text-gray-500'}`}>
                        {getMessageTimestamp(message).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sendingMessage}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 