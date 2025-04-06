'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import NotificationBell from './NotificationBell';
import { 
  Cog6ToothIcon, 
  ChatBubbleLeftIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const { user, error } = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  // Show error state in navigation
  if (error) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-red-600">Error: {error}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-purple-600">
                Love Entrepreneurs
              </Link>
            </div>
            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/matches"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/matches')
                      ? 'border-purple-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Matches
                </Link>
                <Link
                  href="/discovery"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/discovery')
                      ? 'border-purple-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Discovery
                </Link>
                <Link
                  href="/messages"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/messages')
                      ? 'border-purple-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/profile')
                      ? 'border-purple-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Profile
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {user ? (
              <>
                <NotificationBell />
                <div className="ml-3 relative">
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/messages"
                      className={`text-gray-500 hover:text-gray-700 ${
                        isActive('/messages') ? 'text-purple-600' : ''
                      }`}
                    >
                      <ChatBubbleLeftIcon className="h-6 w-6" />
                    </Link>
                    <Link
                      href="/settings"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Cog6ToothIcon className="h-6 w-6" />
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <UserCircleIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 