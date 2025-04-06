import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { Timestamp } from "firebase/firestore";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// User profile operations
export const createUserProfile = async (userId: string, profileData: any) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updateData: any) => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// Matching operations
export const createMatch = async (userId1: string, userId2: string) => {
  try {
    const matchId = [userId1, userId2].sort().join('_');
    await setDoc(doc(db, 'matches', matchId), {
      users: [userId1, userId2],
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    return true;
  } catch (error) {
    console.error('Error creating match:', error);
    return false;
  }
};

export const getMatches = async (userId: string) => {
  try {
    const matchesQuery = query(
      collection(db, 'matches'),
      where('users', 'array-contains', userId)
    );
    const querySnapshot = await getDocs(matchesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting matches:', error);
    return [];
  }
};

// Like operations
export async function createLike(fromUserId: string, toUserId: string): Promise<void> {
  try {
    // Create the like
    const likesRef = collection(db, 'likes');
    await addDoc(likesRef, {
      fromUserId,
      toUserId,
      createdAt: new Date().toISOString()
    });

    // Check if this is a mutual match
    const mutualLikeQuery = query(
      likesRef,
      where('fromUserId', '==', toUserId),
      where('toUserId', '==', fromUserId)
    );
    const mutualLikeSnapshot = await getDocs(mutualLikeQuery);

    if (!mutualLikeSnapshot.empty) {
      // Get user profiles for the notification
      const [fromUserProfile, toUserProfile] = await Promise.all([
        getUserProfile(fromUserId),
        getUserProfile(toUserId)
      ]);

      if (fromUserProfile && toUserProfile) {
        // Create notifications for both users
        const notificationsRef = collection(db, 'notifications');
        const batch = writeBatch(db);

        // Notification for the user who just liked
        const notification1Ref = doc(notificationsRef);
        batch.set(notification1Ref, {
          type: 'match',
          title: 'New Match!',
          message: `You matched with ${toUserProfile.name}`,
          read: false,
          createdAt: new Date().toISOString(),
          userId: fromUserId
        });

        // Notification for the user who was liked
        const notification2Ref = doc(notificationsRef);
        batch.set(notification2Ref, {
          type: 'match',
          title: 'New Match!',
          message: `You matched with ${fromUserProfile.name}`,
          read: false,
          createdAt: new Date().toISOString(),
          userId: toUserId
        });

        await batch.commit();
      }
    }
  } catch (error) {
    console.error('Error creating like:', error);
    throw error;
  }
}

export const getLikes = async (userId: string) => {
  try {
    const likesQuery = query(
      collection(db, 'likes'),
      where('toUserId', '==', userId)
    );
    const querySnapshot = await getDocs(likesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting likes:', error);
    return [];
  }
};

export async function getPotentialMatches(userId: string): Promise<any[]> {
  try {
    // Get the current user's profile to filter matches
    const userProfile = await getUserProfile(userId);
    if (!userProfile) return [];

    // Get all users except the current user
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('id', '!=', userId));
    const querySnapshot = await getDocs(q);

    const potentialMatches = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter out users that the current user has already liked
    const likesRef = collection(db, 'likes');
    const likesQuery = query(likesRef, where('fromUserId', '==', userId));
    const likesSnapshot = await getDocs(likesQuery);
    const likedUserIds = likesSnapshot.docs.map(doc => doc.data().toUserId);

    return potentialMatches.filter(match => !likedUserIds.includes(match.id));
  } catch (error) {
    console.error('Error getting potential matches:', error);
    return [];
  }
}

export async function getMutualMatches(userId: string): Promise<any[]> {
  try {
    // Get all users that the current user has liked
    const likesRef = collection(db, 'likes');
    const userLikesQuery = query(likesRef, where('fromUserId', '==', userId));
    const userLikesSnapshot = await getDocs(userLikesQuery);
    const likedUserIds = userLikesSnapshot.docs.map(doc => doc.data().toUserId);

    // Get all users that have liked the current user
    const userLikedByQuery = query(likesRef, where('toUserId', '==', userId));
    const userLikedBySnapshot = await getDocs(userLikedByQuery);
    const likedByUserIds = userLikedBySnapshot.docs.map(doc => doc.data().fromUserId);

    // Find mutual matches (users that have liked each other)
    const mutualMatchIds = likedUserIds.filter(id => likedByUserIds.includes(id));

    // Get the full profiles of mutual matches
    const mutualMatches = await Promise.all(
      mutualMatchIds.map(async (matchId) => {
        const userProfile = await getUserProfile(matchId);
        return {
          id: matchId,
          ...userProfile
        };
      })
    );

    return mutualMatches;
  } catch (error) {
    console.error('Error getting mutual matches:', error);
    return [];
  }
}

// Chat Functions
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  attachment?: { url: string; type: string }
): Promise<void> {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const newMessage = {
      senderId,
      content,
      timestamp: serverTimestamp(),
      read: false,
      attachment: attachment || null
    };
    
    await addDoc(messagesRef, newMessage);
    
    // Update last message in chat document
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: content,
      lastMessageTime: serverTimestamp(),
      lastMessageSender: senderId
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export function subscribeToMessages(chatId: string, callback: (messages: any[]) => void): () => void {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    callback(messages);
  });
}

export async function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef,
      where('read', '==', false),
      where('senderId', '!=', userId)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

export async function createChat(user1Id: string, user2Id: string): Promise<string> {
  try {
    // Check if chat already exists
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user1Id)
    );
    
    const snapshot = await getDocs(q);
    const existingChat = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(user2Id);
    });
    
    if (existingChat) {
      return existingChat.id;
    }
    
    // Create new chat
    const newChat = {
      participants: [user1Id, user2Id],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      lastMessageSender: null
    };
    
    const docRef = await addDoc(chatsRef, newChat);
    return docRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
}

export async function getUserChats(userId: string): Promise<any[]> {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userId));
    
    const snapshot = await getDocs(q);
    const chats = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const otherUserId = data.participants.find((id: string) => id !== userId);
        const userProfile = await getUserProfile(otherUserId);
        
        return {
          id: doc.id,
          ...data,
          otherUser: userProfile,
          lastMessageTime: data.lastMessageTime?.toDate()
        };
      })
    );
    
    return chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
}

// File Upload Functions
export async function uploadChatAttachment(
  chatId: string,
  file: File,
  senderId: string,
  receiverId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; type: string; size: number }> {
  const fileName = `${chatId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `chat-attachments/${fileName}`);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Error uploading file:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            type: file.type,
            size: file.size
          });
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(error);
        }
      }
    );
  });
}

export async function deleteChatAttachment(chatId: string, fileName: string): Promise<void> {
  try {
    const storageRef = ref(storage, `chats/${chatId}/attachments/${fileName}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// Typing status functions
export async function updateTypingStatus(
  chatId: string,
  userId: string,
  isTyping: boolean
) {
  const chatRef = doc(db, 'chats', chatId);
  const typingRef = doc(chatRef, 'typing', userId);
  
  if (isTyping) {
    await setDoc(typingRef, {
      userId,
      timestamp: serverTimestamp(),
      isTyping: true
    });
  } else {
    await deleteDoc(typingRef);
  }
}

export function subscribeToTypingStatus(
  chatId: string,
  onTypingUpdate: (typingUsers: { userId: string; timestamp: Timestamp }[]) => void
) {
  const chatRef = doc(db, 'chats', chatId);
  const typingRef = collection(chatRef, 'typing');
  
  return onSnapshot(typingRef, (snapshot) => {
    const typingUsers = snapshot.docs.map(doc => ({
      userId: doc.data().userId,
      timestamp: doc.data().timestamp
    }));
    onTypingUpdate(typingUsers);
  });
}

interface Reaction {
  emoji: string;
  userId: string;
  timestamp: Timestamp;
}

export async function toggleMessageReaction(
  chatId: string,
  messageId: string,
  userId: string,
  emoji: string
) {
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  const reactionRef = doc(messageRef, 'reactions', userId + '_' + emoji);

  try {
    const reactionDoc = await getDoc(reactionRef);
    
    if (reactionDoc.exists()) {
      // Remove reaction if it already exists
      await deleteDoc(reactionRef);
    } else {
      // Add new reaction
      await setDoc(reactionRef, {
        emoji,
        userId,
        timestamp: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error toggling reaction:', error);
    throw error;
  }
}

export function subscribeToMessageReactions(
  chatId: string,
  messageId: string,
  callback: (reactions: Reaction[]) => void
) {
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  const reactionsRef = collection(messageRef, 'reactions');

  return onSnapshot(reactionsRef, (snapshot) => {
    const reactions = snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp
    })) as Reaction[];
    callback(reactions);
  });
}

export interface SocialLink {
  platform: string;
  url: string;
}

export const uploadProfilePicture = async (
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log('Starting upload process...');
    console.log('User ID:', userId);
    console.log('File:', file.name, file.size, file.type);

    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Create a simple filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const storageRef = ref(storage, `users/${userId}/profile.${fileExtension}`);
    console.log('Storage reference created:', storageRef.fullPath);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Upload completed, getting download URL...');

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);

    // Update user profile with the new photo URL
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoURL: downloadURL,
      updatedAt: new Date().toISOString()
    });

    return downloadURL;
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

export async function updateSocialLinks(userId: string, links: SocialLink[]) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    socialLinks: links,
    updatedAt: serverTimestamp()
  });
}

export async function getSocialLinks(userId: string): Promise<SocialLink[]> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  return userDoc.data()?.socialLinks || [];
}

export async function deleteProfilePicture(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const photoURL = userDoc.data()?.photoURL;

  if (photoURL) {
    try {
      // Delete the image from Storage
      const imageRef = ref(storage, photoURL);
      await deleteObject(imageRef);

      // Update user document
      await updateDoc(userRef, {
        photoURL: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      throw error;
    }
  }
}
