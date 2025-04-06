import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
        <div className="min-h-screen flex flex-col bg-white">
          <main className="flex-grow">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
} 