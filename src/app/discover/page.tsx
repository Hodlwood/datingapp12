'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { 
  AdjustmentsHorizontalIcon,
  VideoCameraIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import FilterSidebar from '@/app/components/FilterSidebar';

interface UserProfile {
  id: string;
  photoURL: string;
  displayName: string;
  age: number;
  location: string;
  entrepreneurType: string;
  businessStage: string;
  online: boolean;
}

interface FilterOptions {
  ageRange: {
    min: number;
    max: number;
  };
  entrepreneurTypes: string[];
  businessStages: string[];
  location: string;
  onlineOnly: boolean;
}

export default function DiscoverPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    ageRange: { min: 18, max: 65 },
    entrepreneurTypes: [],
    businessStages: [],
    location: '',
    onlineOnly: false
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    const loadProfiles = async () => {
      if (!user) return;

      try {
        const profilesRef = collection(db, 'users');
        const q = query(profilesRef);
        const querySnapshot = await getDocs(q);
        const fetchedProfiles: UserProfile[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id !== user.uid) {
            fetchedProfiles.push({
              id: doc.id,
              photoURL: data.photoURL || '/default-avatar.png',
              displayName: data.displayName || 'Anonymous',
              age: data.age || 0,
              location: data.location || 'Unknown',
              entrepreneurType: data.entrepreneurType || '',
              businessStage: data.businessStage || '',
              online: Math.random() < 0.3, // Temporary random online status
            });
          }
        });

        setProfiles(fetchedProfiles);
        setFilteredProfiles(fetchedProfiles);
      } catch (error) {
        console.error('Error loading profiles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfiles();
  }, [user, loading, router]);

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...profiles];

    // Filter by age range
    filtered = filtered.filter(
      (profile) => profile.age >= filters.ageRange.min && profile.age <= filters.ageRange.max
    );

    // Filter by entrepreneur types
    if (filters.entrepreneurTypes.length > 0) {
      filtered = filtered.filter((profile) =>
        filters.entrepreneurTypes.includes(profile.entrepreneurType)
      );
    }

    // Filter by business stages
    if (filters.businessStages.length > 0) {
      filtered = filtered.filter((profile) =>
        filters.businessStages.includes(profile.businessStage)
      );
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter((profile) =>
        profile.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filter by online status
    if (filters.onlineOnly) {
      filtered = filtered.filter((profile) => profile.online);
    }

    setFilteredProfiles(filtered);
  }, [filters, profiles]);

  const handleVideoChat = (userId: string) => {
    router.push(`/chat/${userId}/video`);
  };

  const handleMessage = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  const handleReject = (userId: string) => {
    // Implement reject functionality
  };

  const handleLike = (userId: string) => {
    // Implement like functionality
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Filter Bar */}
      <div className="sticky top-16 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span>Filters</span>
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {filteredProfiles.length} matches found
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={profile.photoURL}
                  alt={profile.displayName}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-lg font-semibold">{profile.displayName}, {profile.age}</h3>
                  <p className="text-sm">{profile.location}</p>
                  <p className="text-sm">{profile.entrepreneurType}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleVideoChat(profile.id)}
                    className="text-gray-600 hover:text-blue-500"
                    title="Start Video Chat"
                  >
                    <VideoCameraIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => handleMessage(profile.id)}
                    className="text-gray-600 hover:text-blue-500"
                    title="Send Message"
                  >
                    <ChatBubbleLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => handleReject(profile.id)}
                    className="text-gray-600 hover:text-red-500"
                    title="Reject Profile"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleLike(profile.id)}
                    className="text-gray-600 hover:text-green-500"
                    title="Like Profile"
                  >
                    <HeartIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 