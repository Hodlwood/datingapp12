// Flow 1: Gender Selection -> Signup -> Onboarding
// This flow implements the following sequence:
// 1. User selects gender (Man/Woman) on homepage
// 2. Gender is stored in localStorage
// 3. User is redirected to signup page
// 4. After successful signup (email/password or Google), user is redirected to onboarding

// Key components:
// - Homepage (src/app/page.tsx)
// - Signup Page (src/app/signup/page.tsx)
// - Onboarding Flow (src/app/components/OnboardingFlow.tsx)

// Key features:
// - Gender selection with visual feedback
// - Form validation
// - Google authentication
// - Persistent gender selection
// - Protected signup route (redirects to home if no gender selected)

// Usage:
// 1. User lands on homepage
// 2. Clicks either "Man" or "Woman"
// 3. Gets redirected to signup page
// 4. Can sign up with email/password or Google
// 5. After successful signup, proceeds to onboarding

// Note: This flow requires the following dependencies:
// - Firebase Authentication
// - Next.js App Router
// - Framer Motion for animations
// - Tailwind CSS for styling

// Example of key code snippets:

/*
// Homepage gender selection
const handleGenderSelect = (gender: string) => {
  localStorage.setItem('selectedGender', gender);
  router.push('/signup');
};

// Signup page protection
useEffect(() => {
  const gender = localStorage.getItem('selectedGender');
  if (!gender) {
    router.push('/');
  }
}, [router]);

// Post-signup redirect
const handleSubmit = async (e: React.FormEvent) => {
  // ... signup logic ...
  const gender = localStorage.getItem('selectedGender');
  router.push(`/onboarding${gender ? `?gender=${gender}` : ''}`);
};
*/ 