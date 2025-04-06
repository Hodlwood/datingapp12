'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { soundManager } from '@/lib/utils/sound';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Only initialize Firebase Messaging on client side
    if (typeof window !== 'undefined') {
      const messaging = getMessaging();
      
      // Request permission and get token
      getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })
        .then((token) => {
          console.log('FCM Token:', token);
          // Here you would typically send the token to your backend
        })
        .catch((err) => {
          console.error('Failed to get FCM token:', err);
        });

      // Listen for messages
      onMessage(messaging, (payload) => {
        console.log('Message received:', payload);
        if (payload.notification) {
          addNotification({
            id: Date.now().toString(),
            title: payload.notification.title || 'New Message',
            message: payload.notification.body || '',
            type: 'info',
            timestamp: new Date(),
          });
          soundManager.playNotification();
        }
      });
    }
  }, []);

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 