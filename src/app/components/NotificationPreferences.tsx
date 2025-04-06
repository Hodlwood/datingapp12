'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { BellIcon, EnvelopeIcon, BellAlertIcon } from '@heroicons/react/24/outline';

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
}

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    soundNotifications: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const loadPreferences = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (userData?.notificationPreferences) {
          setPreferences(userData.notificationPreferences);
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user?.uid) return;

    try {
      const newPreferences = { ...preferences, [key]: value };
      await updateDoc(doc(db, 'users', user.uid), {
        notificationPreferences: newPreferences,
      });
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  if (loading) {
    return <div>Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-700">Email Notifications</label>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
          </div>
          <button
            onClick={() => updatePreference('emailNotifications', !preferences.emailNotifications)}
            className={`${
              preferences.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                preferences.emailNotifications ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BellAlertIcon className="h-5 w-5 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-700">Push Notifications</label>
              <p className="text-sm text-gray-500">Receive notifications in your browser</p>
            </div>
          </div>
          <button
            onClick={() => updatePreference('pushNotifications', !preferences.pushNotifications)}
            className={`${
              preferences.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                preferences.pushNotifications ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BellIcon className="h-5 w-5 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-700">Sound Notifications</label>
              <p className="text-sm text-gray-500">Play sound for new notifications</p>
            </div>
          </div>
          <button
            onClick={() => updatePreference('soundNotifications', !preferences.soundNotifications)}
            className={`${
              preferences.soundNotifications ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                preferences.soundNotifications ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      </div>
    </div>
  );
} 