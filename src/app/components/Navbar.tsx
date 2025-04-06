'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Navbar() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleAuth = async () => {
    if (user) {
      await signOut();
      router.push('/login');
    } else {
      router.push('/signup');
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link 
              href="/"
              className="flex items-center cursor-pointer"
              replace={true}
            >
              <span className="text-xl font-bold text-blue-600">eMatch.dating</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <Link href="/discovery" className="text-gray-700 hover:text-blue-600">
                      Discovery
                    </Link>
                    <Link href="/messages" className="text-gray-700 hover:text-blue-600">
                      Messages
                    </Link>
                    <Link 
                      href="/profile" 
                      className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
                    >
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt="Profile"
                          fill
                          sizes="(max-width: 768px) 40px, 40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-lg">
                            {user.email?.[0].toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </Link>
                    <button
                      onClick={handleAuth}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link href="/login" className="text-gray-700 hover:text-blue-600">
                      Log In
                    </Link>
                    <Link 
                      href="/signup" 
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 