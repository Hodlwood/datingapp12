import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { AuthRedirect } from '@/app/components/AuthRedirect';
import Navbar from '@/app/components/Navbar';
import ChatWidget from './components/ChatWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Love Entrepreneurs',
  description: 'Find your perfect entrepreneur match',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthRedirect>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
            <ChatWidget />
          </AuthRedirect>
        </AuthProvider>
      </body>
    </html>
  );
}
