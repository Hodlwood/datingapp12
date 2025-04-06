'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/firebase';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/solid';

interface Profile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  nationality: string;
  entrepreneurType: string;
  businessStage: string;
  lookingFor: string[];
  interests: string[];
  relationshipGoal: string;
  photoURL?: string;
  photo?: string;
  photos?: string[];
  bio: string;
  ageRangePreference: {
    min: number;
    max: number;
  };
  relationshipGoals: string;
  location: string;
  interestedIn: 'male' | 'female' | 'both';
}

interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: any;
  read: boolean;
}

interface RejectedProfile {
  id: string;
  userId: string;
  rejectedProfileId: string;
  rejectedAt: any;
  expiresAt: any;
}

const nationalities = [
  'American', 'British', 'Canadian', 'Australian', 'German', 'French', 'Italian', 
  'Spanish', 'Japanese', 'Chinese', 'Indian', 'Brazilian', 'Russian', 'Swedish', 
  'Dutch', 'New Zealander', 'South African', 'Mexican', 'Singaporean', 'Israeli'
];

const entrepreneurTypes = [
  'Tech Entrepreneur', 'E-commerce Founder', 'Social Impact Entrepreneur',
  'Creative Entrepreneur', 'Fashion Entrepreneur', 'Food & Beverage Entrepreneur',
  'Health & Wellness Entrepreneur', 'FinTech Entrepreneur', 'Real Estate Entrepreneur',
  'Education Entrepreneur'
];

const businessStages = [
  'Ideation', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth', 'Scale-up'
];

const lookingFor = [
  'Co-founder', 'Mentor', 'Investor', 'Business Partner', 'Advisor'
];

const interests = [
  'Technology', 'Innovation', 'Travel', 'Fitness', 'Reading', 'Cooking',
  'Art', 'Music', 'Photography', 'Hiking', 'Meditation', 'Entrepreneurship',
  'Networking', 'Personal Development', 'Social Impact'
];

const relationshipGoals = [
  'Business Partnership', 'Mentorship', 'Networking', 'Friendship', 'Romance'
];

const bioTemplates = [
  "Passionate {entrepreneurType} from {nationality}. {age} years young and {businessStage} in my journey. Looking for {lookingFor} to {relationshipGoal}.",
  "As a {nationality} {entrepreneurType}, I'm {businessStage} and seeking {lookingFor} for {relationshipGoal}. {age} years of experience in the field.",
  "Hello! I'm a {age}-year-old {nationality} {entrepreneurType} at the {businessStage} stage. Interested in {relationshipGoal} with {lookingFor}.",
  "Dynamic {entrepreneurType} from {nationality}, {age} years old. Currently {businessStage} and looking to {relationshipGoal} with {lookingFor}.",
  "Innovative {entrepreneurType} with {nationality} roots. At {age}, I'm {businessStage} and seeking {lookingFor} for {relationshipGoal}."
];

const generateRandomProfiles = () => {
  const profiles: Profile[] = [];
  
  // Generate 5 women profiles
  for (let i = 1; i <= 5; i++) {
    profiles.push({
      id: `female-${i}`,
      name: `Sarah ${i}`,
      age: Math.floor(Math.random() * (60 - 25 + 1)) + 25,
      gender: 'female',
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
      entrepreneurType: entrepreneurTypes[Math.floor(Math.random() * entrepreneurTypes.length)],
      businessStage: businessStages[Math.floor(Math.random() * businessStages.length)],
      lookingFor: lookingFor.slice(0, Math.floor(Math.random() * 3) + 1),
      interests: interests.slice(0, Math.floor(Math.random() * 4) + 1),
      relationshipGoal: relationshipGoals[Math.floor(Math.random() * relationshipGoals.length)],
      photoURL: `/images/female-${i}.jpg`,
      bio: generateBio(i),
      ageRangePreference: {
        min: 25,
        max: 50
      },
      relationshipGoals: relationshipGoals[Math.floor(Math.random() * relationshipGoals.length)],
      location: `${Math.floor(Math.random() * 100) + 1} ${nationalities[Math.floor(Math.random() * nationalities.length)]}, ${Math.floor(Math.random() * 100) + 1} ${Math.floor(Math.random() * 100) + 1}`,
      photos: [
        `/images/female-${i}-1.jpg`,
        `/images/female-${i}-2.jpg`,
        `/images/female-${i}-3.jpg`
      ],
      interestedIn: 'both'
    });
  }

  // Generate 5 men profiles
  for (let i = 1; i <= 5; i++) {
    profiles.push({
      id: `male-${i}`,
      name: `John ${i}`,
      age: Math.floor(Math.random() * (60 - 25 + 1)) + 25,
      gender: 'male',
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
      entrepreneurType: entrepreneurTypes[Math.floor(Math.random() * entrepreneurTypes.length)],
      businessStage: businessStages[Math.floor(Math.random() * businessStages.length)],
      lookingFor: lookingFor.slice(0, Math.floor(Math.random() * 3) + 1),
      interests: interests.slice(0, Math.floor(Math.random() * 4) + 1),
      relationshipGoal: relationshipGoals[Math.floor(Math.random() * relationshipGoals.length)],
      photoURL: `/images/male-${i}.jpg`,
      bio: generateBio(i),
      ageRangePreference: {
        min: 25,
        max: 50
      },
      relationshipGoals: relationshipGoals[Math.floor(Math.random() * relationshipGoals.length)],
      location: `${Math.floor(Math.random() * 100) + 1} ${nationalities[Math.floor(Math.random() * nationalities.length)]}, ${Math.floor(Math.random() * 100) + 1} ${Math.floor(Math.random() * 100) + 1}`,
      photos: [
        `/images/male-${i}-1.jpg`,
        `/images/male-${i}-2.jpg`,
        `/images/male-${i}-3.jpg`
      ],
      interestedIn: 'both'
    });
  }

  return profiles;
};

const generateBio = (index: number) => {
  const entrepreneurType = entrepreneurTypes[Math.floor(Math.random() * entrepreneurTypes.length)];
  const nationality = nationalities[Math.floor(Math.random() * nationalities.length)];
  const age = Math.floor(Math.random() * (60 - 25 + 1)) + 25;
  const businessStage = businessStages[Math.floor(Math.random() * businessStages.length)];
  const lookingForType = lookingFor[Math.floor(Math.random() * lookingFor.length)];
  const relationshipGoal = relationshipGoals[Math.floor(Math.random() * relationshipGoals.length)];
  
  // Generate a random bio using a template
  const bioTemplate = bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
  const bio = bioTemplate
    .replace('{entrepreneurType}', entrepreneurType.toLowerCase())
    .replace('{nationality}', nationality)
    .replace('{age}', age.toString())
    .replace('{businessStage}', businessStage.toLowerCase())
    .replace('{lookingFor}', lookingForType.toLowerCase())
    .replace('{relationshipGoal}', relationshipGoal.toLowerCase());

  return bio;
};

const calculateMatchScore = (userProfile: Profile, potentialMatch: Profile): number => {
  let score = 0;
  
  // Age range match (20 points)
  if (userProfile.ageRangePreference && potentialMatch.ageRangePreference) {
    if (userProfile.age >= potentialMatch.ageRangePreference.min && 
        userProfile.age <= potentialMatch.ageRangePreference.max) {
      score += 20;
    }
  }

  // Entrepreneur type match (15 points)
  if (userProfile.entrepreneurType && potentialMatch.entrepreneurType &&
      userProfile.entrepreneurType === potentialMatch.entrepreneurType) {
    score += 15;
  }

  // Business stage match (15 points)
  if (userProfile.businessStage && potentialMatch.businessStage &&
      userProfile.businessStage === potentialMatch.businessStage) {
    score += 15;
  }

  // Looking for match (20 points)
  if (userProfile.lookingFor && potentialMatch.lookingFor) {
    const lookingForMatches = userProfile.lookingFor.filter(option => 
      potentialMatch.lookingFor.includes(option)
    );
    score += (lookingForMatches.length / userProfile.lookingFor.length) * 20;
  }

  // Interests match (20 points)
  if (userProfile.interests && potentialMatch.interests) {
    const interestMatches = userProfile.interests.filter(interest => 
      potentialMatch.interests.includes(interest)
    );
    score += (interestMatches.length / userProfile.interests.length) * 20;
  }

  // Relationship goals match (10 points)
  if (userProfile.relationshipGoals && potentialMatch.relationshipGoals &&
      userProfile.relationshipGoals === potentialMatch.relationshipGoals) {
    score += 10;
  }

  return score;
};

export default function DiscoveryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [direction, setDirection] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayType, setOverlayType] = useState<'like' | 'dislike' | null>(null);
  const [rejectedProfiles, setRejectedProfiles] = useState<RejectedProfile[]>([]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as Profile);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const loadRejectedProfiles = async () => {
      if (!user) return;
      
      try {
        const rejectedRef = collection(db, 'rejectedProfiles');
        const now = new Date();
        
        // First try to get all rejected profiles for the user
        const q = query(
          rejectedRef,
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const rejected = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            userId: doc.data().userId,
            rejectedProfileId: doc.data().rejectedProfileId,
            rejectedAt: doc.data().rejectedAt,
            expiresAt: doc.data().expiresAt
          }))
          .filter(profile => {
            // Filter out expired rejections in memory
            const expiresAt = profile.expiresAt?.toDate();
            return expiresAt && expiresAt > now;
          }) as RejectedProfile[];
        
        console.log('Loaded active rejected profiles:', rejected.length);
        setRejectedProfiles(rejected);
      } catch (err) {
        console.error('Error loading rejected profiles:', err);
        // If there's an error, set an empty array to prevent blocking the app
        setRejectedProfiles([]);
      }
    };
    loadRejectedProfiles();
  }, [user]);

  useEffect(() => {
    const loadProfiles = async () => {
      if (!user || !userProfile) return;

      try {
        setLoadingProfiles(true);
        setError(null);

        // Get rejected profile IDs
        const rejectedProfileIds = rejectedProfiles.map(profile => profile.rejectedProfileId);
        console.log('Rejected profile IDs:', rejectedProfileIds);

        // Determine which gender to show based on user's gender
        const showGender = userProfile.gender === 'male' ? 'female' : 'male';
        console.log('User gender:', userProfile.gender, 'Showing profiles for:', showGender);

        // Query users collection for profiles that match the opposite gender
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('gender', '==', showGender),
          where('onboardingCompleted', '==', true)
        );

        console.log('Querying for profiles with conditions:', {
          gender: showGender,
          onboardingCompleted: true
        });

        const querySnapshot = await getDocs(q);
        console.log('Query returned', querySnapshot.size, 'profiles');

        const loadedProfiles: Profile[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Profile data:', { 
            id: doc.id, 
            gender: data.gender, 
            onboardingCompleted: data.onboardingCompleted,
            name: data.name 
          });
          
          // Skip the current user's profile and rejected profiles
          if (doc.id !== user.uid && !rejectedProfileIds.includes(doc.id)) {
            loadedProfiles.push({
              id: doc.id,
              name: data.name,
              age: data.age,
              gender: data.gender,
              nationality: data.nationality || '',
              entrepreneurType: data.entrepreneurType,
              businessStage: data.businessStage,
              lookingFor: data.lookingFor || [],
              interests: data.interests || [],
              relationshipGoal: data.relationshipGoal,
              photoURL: data.photoURL,
              photos: data.photos || [],
              bio: data.bio || '',
              ageRangePreference: data.ageRangePreference || { min: 18, max: 65 },
              relationshipGoals: data.relationshipGoals,
              location: data.location || '',
              interestedIn: data.interestedIn || 'both'
            });
          }
        });

        console.log('Loaded profiles after filtering:', loadedProfiles.length);
        setProfiles(loadedProfiles);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error loading profiles:', error);
        setError('Failed to load profiles. Please try again.');
      } finally {
        setLoadingProfiles(false);
      }
    };

    if (userProfile) {
      loadProfiles();
    }
  }, [userProfile, rejectedProfiles]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentProfile) return;
    
    setDirection(direction === 'right' ? 1 : -1);
    setOverlayType(direction === 'right' ? 'like' : 'dislike');
    setShowOverlay(true);
    
    // Hide overlay after animation
    setTimeout(() => {
      setShowOverlay(false);
      setCurrentIndex((prev) => prev + 1);
    }, 500);
  };

  const handleLike = () => {
    handleSwipe('right');
  };

  const handleDislike = async () => {
    if (!user || !currentProfile) return;
    
    try {
      // Calculate expiration date (6 months from now)
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      // Store rejection in Firebase with timestamp and expiration
      const rejectedRef = collection(db, 'rejectedProfiles');
      await addDoc(rejectedRef, {
        userId: user.uid,
        rejectedProfileId: currentProfile.id,
        rejectedAt: serverTimestamp(),
        expiresAt: sixMonthsFromNow
      });

      console.log('Stored rejection with 6-month expiration:', currentProfile.id);

      // Set the overlay and direction for the animation
      setDirection(-1);
      setOverlayType('dislike');
      setShowOverlay(true);
      
      // Remove the rejected profile and move to next after animation
      setTimeout(() => {
        setShowOverlay(false);
        setProfiles(prev => prev.filter(profile => profile.id !== currentProfile.id));
        setCurrentIndex(prev => Math.min(prev, profiles.length - 1));
      }, 500);
    } catch (err) {
      console.error('Error storing rejection:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedProfile) return;

    try {
      setSendingMessage(true);
      
      // Create the message document with a simpler structure
      const messageData = {
        fromUserId: user.uid,
        toUserId: selectedProfile.id,
        content: "hi",
        createdAt: serverTimestamp(),
        read: false
      };

      // Create the message in the messages collection
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, messageData);

      // Show green checkmark overlay and swipe right
      setOverlayType('like');
      setShowOverlay(true);
      setDirection(1);
      
      // Close the popup and swipe right after animation
      setTimeout(() => {
        setShowOverlay(false);
        setShowMessagePopup(false);
        setSelectedProfile(null);
        setCurrentIndex((prev) => prev + 1);
      }, 500);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading || loadingProfiles) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error loading profiles</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!profiles.length || currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No more profiles</h2>
          <p className="text-gray-600">Check back later for new matches!</p>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No more profiles</h2>
          <p className="text-gray-600">Check back later for new matches!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, x: -300 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 * direction }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = offset.x * velocity.x;
                if (Math.abs(swipe) > 10000) {
                  handleSwipe(swipe > 0 ? 'right' : 'left');
                }
              }}
              className="bg-white rounded-xl shadow-lg overflow-hidden relative"
            >
              <div className="relative h-[600px]">
                {/* Overlay for Like/Dislike */}
                <AnimatePresence>
                  {showOverlay && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.3 }}
                      className="absolute bottom-32 left-[40%] z-10"
                    >
                      <div className={`rounded-full p-4 shadow-lg ${
                        overlayType === 'like' 
                          ? 'bg-green-500/90' 
                          : 'bg-red-500/90'
                      }`}>
                        {overlayType === 'like' ? (
                          <CheckIcon className="h-12 w-12 text-white" />
                        ) : (
                          <XMarkIcon className="h-12 w-12 text-white" />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {(currentProfile.photoURL || currentProfile.photo || (currentProfile.photos && currentProfile.photos.length > 0)) ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={currentProfile.photoURL || currentProfile.photo || currentProfile.photos?.[0] || ''}
                      alt={currentProfile.name}
                      fill
                      className="object-cover"
                      priority
                    />
                    <button
                      onClick={() => {
                        console.log('Selected profile:', currentProfile);
                        setSelectedProfile({
                          ...currentProfile,
                          id: currentProfile.id // Ensure we're keeping the Firebase document ID
                        });
                        setShowMessagePopup(true);
                      }}
                      className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all cursor-pointer"
                      aria-label="Send message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-500 text-lg">No photo uploaded yet</p>
                      <p className="text-gray-400 text-sm">Profile incomplete</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-3xl font-bold mb-2">{currentProfile.name}, {currentProfile.age}</h2>
                  <p className="text-lg mb-2">{currentProfile.location}</p>
                  <p className="text-lg mb-2">{currentProfile.entrepreneurType}</p>
                  <p className="text-lg mb-2">{currentProfile.businessStage}</p>
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 mb-4 shadow-lg">
                    <p className="text-gray-800 text-base italic">{currentProfile.bio}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentProfile.interests.map((interest, index) => (
                      <span key={index} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-8 p-6">
                <button
                  onClick={handleDislike}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="h-8 w-8" />
                </button>
                <button
                  onClick={handleLike}
                  className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                >
                  <HeartIcon className="h-8 w-8" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Message Popup */}
      {showMessagePopup && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Send message to {selectedProfile.name}</h3>
              <button
                onClick={() => {
                  setShowMessagePopup(false);
                  setSelectedProfile(null);
                  setMessageContent('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type your message..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMessagePopup(false);
                  setSelectedProfile(null);
                  setMessageContent('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageContent.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 