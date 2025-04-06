export interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  company: string;
  role: string;
  imageUrl: string;
  interests: string[];
}

export const profiles: Profile[] = [
  {
    id: '1',
    name: 'Sarah',
    age: 28,
    bio: 'Tech entrepreneur passionate about AI and sustainable living. Love hiking and trying new restaurants.',
    company: 'TechStart',
    role: 'Founder & CEO',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    interests: ['AI', 'Sustainability', 'Hiking', 'Food']
  },
  {
    id: '2',
    name: 'Emma',
    age: 31,
    bio: 'Serial entrepreneur building the future of e-commerce. Coffee addict and yoga enthusiast.',
    company: 'Shopify Plus',
    role: 'Co-Founder',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    interests: ['E-commerce', 'Yoga', 'Coffee', 'Travel']
  },
  {
    id: '3',
    name: 'Sophie',
    age: 29,
    bio: 'Fintech founder revolutionizing digital payments. Love sailing and photography.',
    company: 'PayTech',
    role: 'CEO',
    imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf1000bd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    interests: ['Fintech', 'Sailing', 'Photography', 'Art']
  }
]; 