import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { FirebaseApp } from 'firebase/app';

const messaging = getMessaging(app as FirebaseApp);

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

export function onMessageListener() {
  return new Promise((resolve) => {
    onMessage(messaging, (payload: any) => {
      resolve(payload);
    });
  });
}

export async function saveFCMToken(userId: string, token: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmToken: token
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
}

export async function removeFCMToken(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmToken: null
    });
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
} 