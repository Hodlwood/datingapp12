"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon, FaceSmileIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import { sendMessage, subscribeToMessages, markMessagesAsRead, uploadChatAttachment, updateTypingStatus, subscribeToTypingStatus, toggleMessageReaction, subscribeToMessageReactions } from '@/lib/firebase/firebaseUtils';
import FilePreviewModal from './FilePreviewModal';
import EmojiPicker from './EmojiPicker';
import { compressImage } from '@/lib/utils/imageCompression';
import ImageGallery from './ImageGallery';
import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface MessageAttachment {
  url: string;
  type: string;
  size?: number;
  name?: string;
}

interface Reaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date | { toDate: () => Date };
  attachment?: MessageAttachment;
  reactions?: Reaction[];
}

interface MessageWithReactions extends Message {
  reactions: Reaction[];
}

interface ChatInterfaceProps {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
}

interface UploadProgress {
  progress: number;
  fileName: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel')) return '📊';
  if (fileType.includes('text')) return '📋';
  return '📁';
}

export default function ChatInterface({ chatId, otherUserId, otherUserName }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithReactions[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string; name?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; timestamp: Date }[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [activeReactionMessage, setActiveReactionMessage] = useState<string | null>(null);
  const [reactionPosition, setReactionPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessageWithReactions[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ url: string; timestamp: Date }[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to messages
    const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
      // Subscribe to reactions for each message
      newMessages.forEach((message) => {
        subscribeToMessageReactions(chatId, message.id, (reactions) => {
          setMessages((prevMessages) => {
            const messageIndex = prevMessages.findIndex((m) => m.id === message.id);
            if (messageIndex === -1) return prevMessages;

            const updatedMessages = [...prevMessages];
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              reactions: reactions.map(r => ({
                ...r,
                timestamp: r.timestamp.toDate()
              }))
            };
            return updatedMessages;
          });
        });
      });

      setMessages(newMessages.map(msg => ({
        ...msg,
        reactions: msg.reactions || []
      })));
      setIsLoading(false);
    });

    // Mark messages as read
    markMessagesAsRead(chatId, user.uid).catch(console.error);

    // Subscribe to typing status
    const typingUnsubscribe = subscribeToTypingStatus(chatId, (users) => {
      const now = new Date();
      const filteredUsers = users
        .filter(typingUser => typingUser.userId !== user?.uid)
        .map(typingUser => ({
          userId: typingUser.userId,
          timestamp: typingUser.timestamp.toDate()
        }))
        .filter(user => {
          // Only show typing status if it's less than 3 seconds old
          const age = now.getTime() - user.timestamp.getTime();
          return age < 3000;
        });
      setTypingUsers(filteredUsers);
    });

    return () => {
      unsubscribe();
      typingUnsubscribe();
    };
  }, [chatId, user]);

  useEffect(() => {
    // Extract images from messages for gallery
    const images = messages
      .filter(msg => msg.attachment?.type.startsWith('image/'))
      .map(msg => ({
        url: msg.attachment!.url,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : (msg.timestamp as { toDate: () => Date }).toDate()
      }));
    setGalleryImages(images);
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/') && 
          !file.type.startsWith('application/') && 
          !file.type.startsWith('text/')) {
        alert('Only images, documents, and text files are allowed');
        return;
      }

      try {
        let fileToUpload = file;
        
        // Compress image if it's an image file
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file);
          fileToUpload = compressed.file;
          
          // Preview compressed image
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviewFile({
              url: reader.result as string,
              type: file.type,
              name: file.name
            });
          };
          reader.readAsDataURL(compressed.file);
        }
        
        setSelectedFile(fileToUpload);
      } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing file. Please try again.');
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    try {
      let attachment = undefined;
      if (selectedFile) {
        setUploadProgress({ progress: 0, fileName: selectedFile.name });
        attachment = await uploadChatAttachment(
          chatId,
          selectedFile,
          user!.uid,
          otherUserId,
          (progress) => {
            setUploadProgress(prev => prev ? { ...prev, progress } : null);
          }
        );
        setSelectedFile(null);
        setPreviewFile(null);
        setUploadProgress(null);
      }

      await sendMessage(chatId, user!.uid, newMessage.trim(), attachment);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setUploadProgress(null);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setNewMessage(newMessage);

    // Update typing status
    if (!isTyping && newMessage.trim()) {
      setIsTyping(true);
      updateTypingStatus(chatId, user!.uid, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(chatId, user!.uid, false);
    }, 3000);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleImageClick = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const renderAttachment = (attachment: Message['attachment'], index: number) => {
    if (!attachment) return null;

    if (attachment.type.startsWith('image/')) {
      return (
        <div className="mt-2">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{getFileIcon(attachment.type)}</span>
            <span className="text-xs opacity-70">
              {attachment.size ? formatFileSize(attachment.size) : 'Image'}
            </span>
          </div>
          <img
            src={attachment.url}
            alt="Attachment"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleImageClick(index)}
          />
        </div>
      );
    }

    return (
      <div className="mt-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getFileIcon(attachment.type)}</span>
          <span className="text-xs opacity-70">
            {attachment.size ? formatFileSize(attachment.size) : 'Document'}
          </span>
        </div>
        <button
          onClick={() => setPreviewFile(attachment)}
          className="text-blue-500 hover:text-blue-600 underline text-sm mt-1"
        >
          View Attachment
        </button>
      </div>
    );
  };

  const handleReactionClick = (messageId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setReactionPosition({
      top: rect.top - 50,
      left: rect.left
    });
    setActiveReactionMessage(messageId);
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await toggleMessageReaction(chatId, messageId, user!.uid, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
      alert('Failed to add reaction. Please try again.');
    }
  };

  const renderReactions = (reactions: Reaction[] = []) => {
    if (reactions.length === 0) return null;

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction.userId);
      return acc;
    }, {} as Record<string, string[]>);
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(groupedReactions).map(([emoji, users]) => (
          <span
            key={emoji}
            className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-xs"
          >
            {emoji} {users.length}
          </span>
        ))}
      </div>
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results = messages.filter(message => 
      message.content.toLowerCase().includes(query.toLowerCase()) ||
      (message.attachment?.name && message.attachment.name.toLowerCase().includes(query.toLowerCase()))
    );
    setSearchResults(results);
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-yellow-100');
      setTimeout(() => {
        element.classList.remove('bg-yellow-100');
      }, 2000);
    }
  };

  const formatTimestamp = (timestamp: Date | { toDate: () => Date }) => {
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const isCurrentUserMessage = messages[messages.length - 1].sender === user?.uid;

  const handleReaction = async (messageId: string, reaction: string) => {
    if (!user) return;
    
    const messageRef = doc(db, 'messages', messageId);
    const message = messages.find(m => m.id === messageId);
    
    if (!message) return;

    const existingReactions = message.reactions || [];
    const userReactions = existingReactions.filter(r => r.emoji === reaction && r.userId === user.uid);
    const hasReacted = userReactions.length > 0;

    if (hasReacted) {
      // Remove reaction
      await updateDoc(messageRef, {
        reactions: arrayRemove(userReactions[0])
      });
    } else {
      // Add reaction
      await updateDoc(messageRef, {
        reactions: arrayUnion({
          emoji: reaction,
          userId: user.uid,
          timestamp: new Date()
        })
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      {/* Chat Header */}
      <div className="flex flex-col border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600">
                {otherUserName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold">{otherUserName}</h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {searchQuery && (
            <div className="absolute z-10 left-4 right-4 mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      scrollToMessage(result.id);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full p-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm truncate">{result.content}</p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(result.timestamp)}
                      </p>
                    </div>
                    {result.attachment && (
                      <span className="text-gray-400">{getFileIcon(result.attachment.type)}</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500">No messages found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            id={`message-${message.id}`}
            key={message.id}
            className={`flex ${
              message.sender === user?.uid ? 'justify-end' : 'justify-start'
            } transition-colors duration-300`}
          >
            <div className="relative group">
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender === user?.uid
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {renderAttachment(message.attachment, index)}
                {renderReactions(message.reactions)}
                <p className="text-xs mt-1 opacity-70">
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
              <button
                onClick={(e) => handleReactionClick(message.id, e)}
                className={`absolute -bottom-2 right-2 p-1 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                  message.sender === user?.uid ? 'right-2' : 'left-2'
                }`}
              >
                <FaceSmileIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-xs text-gray-600 mt-1">{otherUserName} is typing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload progress bar */}
      {uploadProgress && (
        <div className="px-4 py-2 bg-gray-100 border-t">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Uploading {uploadProgress.fileName}... {Math.round(uploadProgress.progress)}%
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewFile(null);
                setUploadProgress(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <label
            htmlFor="file-upload"
            className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <PaperClipIcon className="h-6 w-6" />
          </label>
          <input
            type="text"
            value={newMessage}
            onChange={handleMessageChange}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() && !selectedFile}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </div>
      </form>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile || { url: '', type: '' }}
      />

      {/* Emoji picker */}
      {activeReactionMessage && (
        <EmojiPicker
          position={reactionPosition}
          onSelect={(emoji) => {
            handleAddReaction(messages[messages.length - 1].id, emoji);
            setActiveReactionMessage(null);
          }}
          onClose={() => setActiveReactionMessage(null)}
        />
      )}

      {/* Image Gallery */}
      {galleryOpen && (
        <ImageGallery
          images={galleryImages}
          initialIndex={galleryIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
} 