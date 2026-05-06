import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Knowledge Arena',
  description: 'Reinforce and test your understanding of biology and computer science',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen text-gray-900 antialiased`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-gray-900 tracking-tight">
              Knowledge Arena
            </Link>
            <nav className="flex gap-5">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Topics
              </Link>
              <Link href="/history" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                History
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
