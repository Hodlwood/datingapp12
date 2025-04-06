'use client';

import { useState } from 'react';
import { useNotifications } from '@/lib/contexts/NotificationContext';
import { BellIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const context = useNotifications();
  const unreadCount = context.notifications.length;

  const handleNotificationClick = (notification: Notification) => {
    context.removeNotification(notification.id);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    context.clearNotifications();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Notifications</h3>
              {context.notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {context.notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              context.notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {notification.timestamp instanceof Date 
                        ? notification.timestamp.toLocaleDateString()
                        : new Date(notification.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 